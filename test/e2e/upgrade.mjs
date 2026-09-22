// Upgrade test: Cookie Quick Manager 0.5rc2 (from the upstream git history)
// is installed in Firefox with some settings, then replaced by the CookieTin
// build that carries its add-on ID (npm run package:cqm). The settings and
// protected cookies must survive and a welcome page must explain the change.
//
//   node test/e2e/upgrade.mjs [--headful]
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CQM_ID = "{60f82f00-9ad5-4de5-b31c-b16a47c51558}";
const UUID = "0c9d8e7f-6a5b-4c3d-8e2f-1a0b9c8d7e6f";
const BASE = `moz-extension://${UUID}`;
const headless = !process.argv.includes("--headful");
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. The original add-on, straight from its last release tag.
const legacyDir = path.join(root, "dist-e2e-legacy/cqm-0.5rc2");
await rm(legacyDir, { recursive: true, force: true });
await mkdir(legacyDir, { recursive: true });
const tar = path.join(root, "dist-e2e-legacy/cqm.tar");
execFileSync("git", ["archive", "--format=tar", "-o", tar, "0.5rc2", "src"], { cwd: root });
execFileSync("tar", ["--force-local", "-xf", tar.replaceAll("\\", "/"), "-C", legacyDir.replaceAll("\\", "/"), "--strip-components=1"]);
const legacyManifest = JSON.parse(await readFile(path.join(legacyDir, "manifest.json"), "utf8"));
// On AMO the ID comes from the signature; a temporary install needs it in the manifest.
legacyManifest.browser_specific_settings = { gecko: { id: CQM_ID } };
await writeFile(path.join(legacyDir, "manifest.json"), JSON.stringify(legacyManifest, null, 2));

// 2. CookieTin with Cookie Quick Manager's ID.
const b = spawnSync(process.execPath, [path.join(root, "scripts/build.mjs"), "--e2e", "--cqm"], { stdio: "inherit" });
if (b.status) process.exit(1);

async function findPage(browser, pred, timeout = 8000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    for (const p of await browser.pages()) {
      const href = await p.evaluate(() => location.href).catch(() => "");
      if (pred(href)) return p;
    }
    await sleep(150);
  }
  return null;
}

async function openPage(browser, url) {
  const page = await browser.newPage();
  page.goto(url).catch(() => {});
  const p = await findPage(browser, href => href === url);
  if (!p) throw new Error("could not open " + url);
  return p;
}

const api = (page, fn, ...args) => page.evaluate(`(${fn})(globalThis.browser, ...${JSON.stringify(args)})`);

let failed = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}\n    ${String(e.message).split("\n").join("\n    ")}`);
  }
};

const browser = await puppeteer.launch({
  browser: "firefox",
  headless,
  extraPrefsFirefox: { "extensions.webextensions.uuids": JSON.stringify({ [CQM_ID]: UUID }) }
});

try {
  console.log("\nupgrade Cookie Quick Manager 0.5rc2 → CookieTin (same add-on ID)");
  await browser.installExtension(legacyDir);
  await sleep(800);
  let page = await openPage(browser, `${BASE}/options.html`);

  await step("Cookie Quick Manager is installed and keeps its settings", async () => {
    const version = await api(page, async b => b.runtime.getManifest().version);
    assert.equal(version, "0.5rc2");
    await api(page, async (b, exp) => {
      await b.storage.local.set({
        protected_cookies: { ".example.com": ["sid"], "shop.test": ["cart", "lang"] },
        delete_all_on_restart: true,
        prevent_protected_cookies_deletion: true,
        open_in_new_tab: false,
        display_deletion_alert: false,
        template: "NETSCAPE",
        skin: "default",
        auto_actualize_checkbox: false,
        addonSize: { width: 1300, height: 820 }
      });
      await b.cookies.set({ url: "https://example.com/", name: "sid", value: "keep-me", domain: ".example.com", secure: true, expirationDate: exp });
    }, Math.floor(Date.now() / 1000) + 86400);
  });

  await browser.installExtension(path.join(root, "dist-e2e-cqm/firefox"));
  await sleep(1500);

  await step("the update opens CookieTin's welcome page", async () => {
    const welcome = await findPage(browser, href => href === `${BASE}/options/options.html#welcome`);
    assert.ok(welcome, "no welcome tab");
    page = welcome;
    const text = await (async () => {
      for (let i = 0; i < 40; i++) {
        const t = await page.evaluate(() => document.querySelector("#welcome")?.textContent || "").catch(() => "");
        if (t) return t;
        await sleep(100);
      }
      return "";
    })();
    assert.match(text, /Cookie Quick Manager is now CookieTin/);
    assert.match(text, /protected cookies: 3/);
  });

  await step("settings were converted, legacy keys removed", async () => {
    const all = await api(page, async b => b.storage.local.get(null));
    assert.equal(all.settings.deleteOnStartup, true);
    assert.equal(all.settings.guardProtected, true);
    assert.equal(all.settings.openIn, "window");
    assert.equal(all.settings.confirmBulk, false);
    assert.equal(all.settings.exportFormat, "netscape");
    assert.equal(all.settings.autoRefresh, false);
    assert.equal(all.settings.windowWidth, 1300);
    assert.deepEqual(all.protected_cookies, { ".example.com": ["sid"], "shop.test": ["cart", "lang"] });
    for (const k of ["delete_all_on_restart", "template", "skin", "addonSize", "open_in_new_tab"]) assert.ok(!(k in all), k + " left behind");
  });

  await step("access to all sites is still granted", async () => {
    assert.equal(await api(page, async b => b.permissions.contains({ origins: ["<all_urls>"] })), true);
  });

  await step("the protected cookie is still guarded after the update", async () => {
    await api(page, async b => b.cookies.remove({ url: "https://example.com/", name: "sid" }));
    await sleep(800);
    const c = await api(page, async b => b.cookies.get({ url: "https://example.com/", name: "sid" }));
    assert.equal(c?.value, "keep-me");
  });

  await step("'Got it' hides the welcome card for good", async () => {
    await page.evaluate(() => document.querySelector("#welcome-ok").click());
    await sleep(300);
    const all = await api(page, async b => b.storage.local.get(null));
    assert.ok(!("migratedFromCqm" in all));
    await page.evaluate(() => location.reload()).catch(() => {});
    await sleep(800);
    assert.equal(await page.evaluate(() => !!document.querySelector("#welcome")), false);
  });

  await step("a later CookieTin update does not migrate again", async () => {
    await browser.installExtension(path.join(root, "dist-e2e-cqm/firefox"));
    await sleep(1200);
    const again = await findPage(browser, href => href.endsWith("#welcome") && href !== "", 1500);
    const all = await api(await openPage(browser, `${BASE}/options/options.html`), async b => b.storage.local.get(null));
    assert.ok(!("migratedFromCqm" in all), "marker came back");
    assert.equal(all.settings.windowWidth, 1300);
    void again;
  });
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
