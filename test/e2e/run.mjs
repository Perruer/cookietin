// End-to-end tests of CookieTin in real Chrome for Testing, Firefox and Edge
// (Puppeteer). Cookies are created through the cookies API and by a local
// test page; nothing goes to the internet.
//
//   node test/e2e/run.mjs [chrome|firefox|edge] [--headful]
import http from "node:http";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GECKO_ID = "{80cc9392-1f34-433b-9a62-1b4e67b740d4}";
const FIREFOX_UUID = "5b0c4e2a-7d1f-4c8e-9a3b-6f2d8e1c4a70";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const headless = !process.argv.includes("--headful");
const only = process.argv.slice(2).filter(a => !a.startsWith("--"));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const future = () => Math.floor(Date.now() / 1000) + 30 * 86400;

/* ------------------------------------------------------- test server -- */

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "set-cookie": ["srv=1; Path=/; Max-Age=3600"] });
  res.end(`<!doctype html><title>Test page</title><h1>CookieTin test page</h1>
<script>
  document.cookie = "js=from-page; path=/; max-age=3600";
  localStorage.setItem("a", "1"); localStorage.setItem("b", "2"); sessionStorage.setItem("s", "3");
</script>`);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const PAGE = `http://127.0.0.1:${server.address().port}/page.html`;

const build = spawnSync(process.execPath, [path.join(root, "scripts/build.mjs"), "--e2e"], { stdio: "inherit" });
if (build.status) process.exit(1);

/* ----------------------------------------------------------- helpers -- */

async function launch(kind) {
  if (kind !== "firefox") {
    const browser = await puppeteer.launch({
      browser: "chrome",
      executablePath: kind === "edge" ? EDGE : undefined,
      headless,
      pipe: true,
      enableExtensions: [path.join(root, "dist-e2e/chrome")],
      args: ["--lang=en"]
    });
    const sw = await browser.waitForTarget(t => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"));
    return { browser, base: sw.url().split("/").slice(0, 3).join("/") };
  }
  const browser = await puppeteer.launch({
    browser: "firefox",
    headless,
    extraPrefsFirefox: {
      "extensions.webextensions.uuids": JSON.stringify({ [GECKO_ID]: FIREFOX_UUID }),
      "privacy.userContext.enabled": true
    }
  });
  await browser.installExtension(path.join(root, "dist-e2e/firefox"));
  return { browser, base: `moz-extension://${FIREFOX_UUID}` };
}

async function openExtPage(browser, url) {
  const page = await browser.newPage();
  page.goto(url).catch(() => {});
  for (let i = 0; i < 80; i++) {
    await sleep(100);
    for (const p of await browser.pages()) {
      const href = await p.evaluate(() => location.href).catch(() => "");
      if (href === url) {
        await p.bringToFront().catch(() => {});
        return p;
      }
    }
  }
  throw new Error("could not open " + url);
}

/** Runs a function with the WebExtension API inside an extension page. */
const api = (page, fn, ...args) =>
  page.evaluate(`(${fn})(globalThis.browser || globalThis.chrome, ...${JSON.stringify(args)})`);

/** Evaluates `expr` in the page with $ = querySelector and $$ = querySelectorAll. */
const q = (page, expr) => page.evaluate(`(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const v = (${expr});
  // DOM nodes can't be serialized back through WebDriver BiDi (Firefox).
  return v && typeof v === "object" && v.nodeType ? true : v;
})()`);

async function waitFor(page, expr, timeout = 6000) {
  const until = Date.now() + timeout;
  let last;
  while (Date.now() < until) {
    last = await q(page, expr).catch(e => (last = e.message, null));
    if (last) return last;
    await sleep(100);
  }
  throw new Error(`timeout waiting for ${expr}`);
}

/** Clicks an element (optionally with modifier keys) via a DOM event. */
const click = (page, selector, mods = {}) => q(page, `(() => {
  const el = $(${JSON.stringify(selector)});
  if (!el) throw new Error("no element " + ${JSON.stringify(selector)});
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...${JSON.stringify(mods)} }));
  return true;
})()`);

/** Types into an input/textarea the way Preact listens to it. */
const type = (page, selector, value) => q(page, `(() => {
  const el = $(${JSON.stringify(selector)});
  el.value = ${JSON.stringify(value)};
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
})()`);

const select = (page, selector, value) => q(page, `(() => {
  const el = $(${JSON.stringify(selector)});
  el.value = ${JSON.stringify(value)};
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
})()`);

const cookieRow = name => `#cookie-list li[data-name='${name}']`;

/* ------------------------------------------------------------- tests -- */

async function run(kind) {
  const ctx = await launch(kind);
  const { browser } = ctx;
  const isFx = kind === "firefox";
  const DEF = isFx ? "firefox-default" : "0";
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

  const get = (page, details) => api(page, async (b, d) => b.cookies.get(d), details);
  const all = (page, filter = {}) => api(page, async (b, f) => b.cookies.getAll({ ...f, partitionKey: {} }), filter);

  try {
    await sleep(800);
    // Seed the test page (cookies + storage) and remember its tab.
    const site = await browser.newPage();
    await site.goto(PAGE);
    const opts = await openExtPage(browser, `${ctx.base}/options/options.html`);

    await step("extension has access to all sites", async () => {
      assert.equal(await api(opts, async b => b.permissions.contains({ origins: ["<all_urls>"] })), true);
    });

    await api(opts, async (b, exp, def) => {
      const set = d => b.cookies.set({ storeId: def, ...d });
      await set({ url: "https://example.com/", name: "sid", value: "secret-session", domain: ".example.com", secure: true, httpOnly: true, expirationDate: exp });
      await set({ url: "https://example.com/", name: "pref", value: "light", domain: ".example.com", secure: true, expirationDate: exp });
      await set({ url: "https://www.example.com/", name: "host", value: "only-www", secure: true, expirationDate: exp });
      await set({ url: "https://tracker.test/", name: "embed", value: "partitioned", secure: true, sameSite: "no_restriction", expirationDate: exp, partitionKey: { topLevelSite: "https://example.com" } });
      await set({ url: "https://other.org/", name: "o1", value: "x", expirationDate: exp });
      await set({ url: "https://other.org/", name: "o2", value: "y", expirationDate: exp });
    }, future(), DEF);

    await step("partitioned cookie was created (test precondition)", async () => {
      const list = await all(opts, { domain: "tracker.test" });
      assert.equal(list.length, 1);
      assert.equal(list[0].partitionKey?.topLevelSite, "https://example.com");
    });

    // ------------------------------------------------------------ manager
    const mgr = await openExtPage(browser, `${ctx.base}/manager/manager.html?q=example.com`);
    await mgr.setViewport({ width: 1280, height: 800 }).catch(() => {});

    await step("manager lists the site's cookies, incl. partitioned ones", async () => {
      await waitFor(mgr, `$$("#domain-list li[data-domain]").length >= 3`);
      const domains = await q(mgr, `$$("#domain-list li[data-domain]").map(li => li.dataset.domain)`);
      assert.deepEqual(domains, ["example.com", "www.example.com", "tracker.test"]);
      const names = await q(mgr, `$$("#cookie-list li[data-name]").map(li => li.dataset.name).sort()`);
      assert.deepEqual(names, ["embed", "host", "pref", "sid"]);
      assert.ok(await q(mgr, `!!$("${cookieRow("embed")} .tag.part")`), "partitioned tag");
    });

    await step("search with name: filter", async () => {
      await type(mgr, "#search", "example name:pref");
      await waitFor(mgr, `$$("#cookie-list li[data-name]").length === 1`);
      await type(mgr, "#search", "example.com");
      await waitFor(mgr, `$$("#cookie-list li[data-name]").length === 4`);
    });

    await step("editing a value saves it to the browser", async () => {
      await click(mgr, cookieRow("pref"));
      await waitFor(mgr, `$("#f-value")?.value === "light"`);
      await type(mgr, "#f-value", "dark");
      await click(mgr, "#save");
      await waitFor(mgr, `$("#toast")?.textContent.includes("Saved")`);
      const c = await get(mgr, { url: "https://example.com/", name: "pref", storeId: DEF });
      assert.equal(c.value, "dark");
      assert.equal(c.domain, ".example.com");
    });

    await step("renaming replaces the cookie (old one removed)", async () => {
      await type(mgr, "#f-name", "theme");
      await mgr.keyboard.down("Control");
      await mgr.keyboard.press("s");
      await mgr.keyboard.up("Control");
      await waitFor(mgr, `!!$("${cookieRow("theme")}")`);
      assert.equal(await get(mgr, { url: "https://example.com/", name: "pref", storeId: DEF }), null);
      const c = await get(mgr, { url: "https://example.com/", name: "theme", storeId: DEF });
      assert.equal(c?.value, "dark");
    });

    await step("URL/Base64 tools and JWT decoding", async () => {
      await type(mgr, "#f-value", "aGVsbG8gd29ybGQ=");
      await q(mgr, `[...document.querySelectorAll(".tools button")].find(b => b.textContent.includes("Base64 decode")).click()`);
      assert.equal(await q(mgr, `$("#f-value").value`), "hello world");
      await type(mgr, "#f-value", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiJ9.sig");
      await waitFor(mgr, `$(".jwt pre")?.textContent.includes('"sub": "42"')`);
      // Discard: reopen the saved cookie.
      await click(mgr, "#refresh");
    });

    await step("protected cookie: lock icon, guarded against site deletion", async () => {
      mgr.on("dialog", d => d.accept().catch(() => {}));
      await click(mgr, cookieRow("sid"));
      await waitFor(mgr, `$("#f-name")?.value === "sid"`);
      await click(mgr, "#protect");
      await waitFor(mgr, `!!$("${cookieRow("sid")} .tag")`);
      const map = await api(mgr, async b => (await b.storage.local.get("protected_cookies")).protected_cookies);
      assert.deepEqual(map, { ".example.com": ["sid"] });
      assert.equal(await q(mgr, `$("#delete").disabled`), true, "delete is disabled for protected cookies");
      // A site (or the browser) deletes it: the background puts it back.
      await api(mgr, async (b, def) => b.cookies.remove({ url: "https://example.com/", name: "sid", storeId: def }), DEF);
      await sleep(800);
      const c = await get(mgr, { url: "https://example.com/", name: "sid", storeId: DEF });
      assert.equal(c?.value, "secret-session");
      assert.equal(c?.httpOnly, true);
    });

    await step("multi-select with Ctrl-click and bulk delete keeps protected, undo restores", async () => {
      await click(mgr, "#refresh");
      await sleep(300);
      await click(mgr, cookieRow("host"));
      await click(mgr, cookieRow("theme"), { ctrlKey: true });
      await click(mgr, cookieRow("sid"), { ctrlKey: true });
      await waitFor(mgr, `$("#bulk")?.textContent.includes("Selected: 3")`);
      await click(mgr, "#bulk-delete");
      await waitFor(mgr, `!!$("#confirm-dialog")`);
      assert.match(await q(mgr, `$("#confirm-dialog").textContent`), /Delete 2 cookies\?.*Protected ones kept: 1/);
      await click(mgr, "#confirm-yes");
      await waitFor(mgr, `$("#toast")?.textContent.includes("Deleted cookies: 2")`);
      assert.equal(await get(mgr, { url: "https://www.example.com/", name: "host", storeId: DEF }), null);
      assert.ok(await get(mgr, { url: "https://example.com/", name: "sid", storeId: DEF }));
      await click(mgr, "#toast-undo");
      await waitFor(mgr, `!!$("${cookieRow("host")}") && !!$("${cookieRow("theme")}")`);
      const c = await get(mgr, { url: "https://www.example.com/", name: "host", storeId: DEF });
      assert.equal(c?.value, "only-www");
      assert.equal(c?.hostOnly, true);
    });

    await step("partitioned cookie can be deleted (Cookie Quick Manager couldn't)", async () => {
      await click(mgr, cookieRow("embed"));
      await waitFor(mgr, `$("#f-partition")?.value === "https://example.com"`);
      await click(mgr, "#delete");
      await waitFor(mgr, `!$("${cookieRow("embed")}")`);
      assert.equal((await all(mgr, { domain: "tracker.test" })).length, 0);
    });

    await step("new cookie", async () => {
      await click(mgr, "#new-cookie");
      await waitFor(mgr, `!!$("#f-name")`);
      await type(mgr, "#f-name", "created");
      await type(mgr, "#f-value", "by-test");
      await type(mgr, "#f-domain", "new.example.com");
      await click(mgr, "#save");
      await waitFor(mgr, `$("#toast")?.textContent.includes("Saved")`);
      const c = await get(mgr, { url: "https://new.example.com/", name: "created", storeId: DEF });
      assert.equal(c?.value, "by-test");
      assert.equal(c?.secure, true);
    });

    await step("export as cookies.txt", async () => {
      await type(mgr, "#search", "other.org");
      await waitFor(mgr, `$$("#cookie-list li[data-name]").length === 2`);
      await click(mgr, "#export");
      await waitFor(mgr, `!!$("#export-dialog")`);
      await select(mgr, "#export-format", "netscape");
      const text = await waitFor(mgr, `$("#export-text").value.startsWith("# Netscape") && $("#export-text").value`);
      assert.match(text, /^other\.org\tFALSE\t\/\tFALSE\t\d+\to1\tx$/m);
      assert.match(text, /^other\.org\tFALSE\t\/\tFALSE\t\d+\to2\ty$/m);
      await select(mgr, "#export-format", "json");
      await q(mgr, `window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
      await waitFor(mgr, `!$("#export-dialog")`);
    });

    await step("import JSON (Cookie-Editor layout) with protection", async () => {
      await click(mgr, "#import");
      await waitFor(mgr, `!!$("#import-dialog")`);
      const json = JSON.stringify([
        { domain: ".imported.test", name: "i1", value: "one", path: "/", secure: true, httpOnly: false, hostOnly: false, session: false, expirationDate: future(), sameSite: "lax" },
        { domain: "imported.test", name: "i2", value: "two", path: "/", secure: false, httpOnly: true, hostOnly: true, session: true, sameSite: "unspecified" }
      ]);
      await type(mgr, "#import-text", json);
      await waitFor(mgr, `$("#import-summary")?.textContent.includes("Found 2 cookies")`);
      await click(mgr, "#import-protect");
      await click(mgr, "#import-run");
      await waitFor(mgr, `$("#toast")?.textContent.includes("Imported cookies: 2")`);
      const list = await all(mgr, { domain: "imported.test" });
      assert.deepEqual(list.map(c => c.name).sort(), ["i1", "i2"]);
      assert.equal(list.find(c => c.name === "i2").session, true);
      const map = await api(mgr, async b => (await b.storage.local.get("protected_cookies")).protected_cookies);
      assert.deepEqual(map[".imported.test"], ["i1"]);
      assert.deepEqual(map["imported.test"], ["i2"]);
    });

    // -------------------------------------------------------------- popup
    const tabId = await api(opts, async (b, url) => (await b.tabs.query({})).find(t => t.url === url).id, PAGE);
    let popup = await openExtPage(browser, `${ctx.base}/popup/popup.html?tab=${tabId}`);

    await step("popup shows the site, cookie and storage counts", async () => {
      await waitFor(popup, `$(".site .host")?.textContent === "127.0.0.1"`);
      assert.equal(await q(popup, `$("#delete-site .count").textContent`), "2", "srv + js cookies");
      assert.equal(await q(popup, `$("#clear-storage .count").textContent`), "3", "2 localStorage + 1 sessionStorage");
    });

    await step("popup: delete the site's cookies, then undo", async () => {
      await click(popup, "#delete-site");
      await waitFor(popup, `$(".note")?.textContent.includes("Deleted cookies: 2")`);
      assert.equal((await all(popup, { domain: "127.0.0.1" })).length, 0);
      await click(popup, "#undo");
      await waitFor(popup, `$(".note")?.textContent.includes("Restored cookies: 2")`);
      assert.equal((await all(popup, { domain: "127.0.0.1" })).length, 2);
    });

    await step("popup: clear site data (localStorage + sessionStorage)", async () => {
      await click(popup, "#clear-storage");
      await waitFor(popup, `$(".note")?.textContent.includes("Site data cleared")`);
      const n = await site.evaluate(() => localStorage.length + sessionStorage.length);
      assert.equal(n, 0);
    });

    await step("popup: delete all cookies asks twice and keeps protected", async () => {
      await click(popup, "#delete-store");
      await waitFor(popup, `$("#delete-store").classList.contains("confirm")`);
      assert.ok(await get(popup, { url: "https://other.org/", name: "o1", storeId: DEF }), "nothing deleted after the first click");
      await click(popup, "#delete-store");
      await waitFor(popup, `$(".note")?.textContent.includes("Protected ones kept: 3")`);
      const left = (await all(popup, { storeId: DEF })).map(c => c.name).sort();
      assert.deepEqual(left, ["i1", "i2", "sid"]);
    });

    await step("periodic cleanup keeps protected cookies and open sites", async () => {
      await api(popup, async (b, exp, def) => {
        await b.cookies.set({ url: "https://gone.test/", name: "g", value: "1", expirationDate: exp, storeId: def });
        await b.cookies.set({ url: "http://127.0.0.1/", name: "keep", value: "open-tab", expirationDate: exp, storeId: def });
      }, future(), DEF);
      const r = await mgr.evaluate(() => globalThis.__ctCleanup(true));
      assert.ok(r.removed >= 1, JSON.stringify(r));
      const left = (await all(popup, { storeId: DEF })).map(c => c.name).sort();
      assert.deepEqual(left, ["i1", "i2", "keep", "sid"]);
    });

    // ------------------------------------------------------------ options
    await step("options: restore a Cookie Quick Manager backup", async () => {
      await opts.evaluate(() => location.reload()).catch(() => {});
      await sleep(700);
      const backup = JSON.stringify({
        protected_cookies: { ".legacy.test": ["a", "b"] },
        delete_all_on_restart: true,
        prevent_protected_cookies_deletion: true,
        open_in_new_tab: false,
        display_deletion_alert: false,
        template: "NETSCAPE",
        skin: "default"
      });
      const n = await opts.evaluate(t => globalThis.__ctRestore(t), backup);
      assert.equal(n, 2);
      const s = await api(opts, async b => (await b.storage.local.get("settings")).settings);
      assert.equal(s.deleteOnStartup, true);
      assert.equal(s.openIn, "window");
      assert.equal(s.confirmBulk, false);
      assert.equal(s.exportFormat, "netscape");
      await waitFor(opts, `$("#protected-list")?.textContent.includes(".legacy.test")`);
      assert.equal(await q(opts, `$("#opt-startup").checked`), true);
    });

    await step("options: a setting change is saved", async () => {
      await click(opts, "#opt-startup");
      await sleep(300);
      const s = await api(opts, async b => (await b.storage.local.get("settings")).settings);
      assert.equal(s.deleteOnStartup, false);
    });

    // ------------------------------------------------ containers (Firefox)
    if (isFx) {
      await step("Firefox containers: listed, filtered and copied into", async () => {
        const id = await api(opts, async b => (await b.contextualIdentities.create({ name: "Work", color: "blue", icon: "briefcase" })).cookieStoreId);
        await api(opts, async (b, sid, exp) => b.cookies.set({ url: "https://work.test/", name: "w", value: "in-container", storeId: sid, expirationDate: exp }), id, future());
        await mgr.evaluate(() => location.reload()).catch(() => {});
        await sleep(900);
        await waitFor(mgr, `[...$("#store-filter").options].some(o => o.textContent === "Work")`);
        await type(mgr, "#search", "");
        await select(mgr, "#store-filter", id);
        await waitFor(mgr, `$$("#cookie-list li[data-name]").map(li => li.dataset.name).join() === "w"`);
        await select(mgr, "#store-filter", "all");
        await type(mgr, "#search", "imported.test");
        await waitFor(mgr, `!!$("${cookieRow("i1")}")`);
        await click(mgr, cookieRow("i1"));
        await click(mgr, "#select-all");
        await waitFor(mgr, `!!$("#copy-to")`);
        await select(mgr, "#copy-to", id);
        await waitFor(mgr, `$("#toast")?.textContent.includes("Copied 2 cookies to Work")`);
        const copied = await all(mgr, { storeId: id, domain: "imported.test" });
        assert.equal(copied.length, 2);
      });
    }

    await step("manager renders in dark theme without errors", async () => {
      await api(opts, async b => b.storage.local.set({ settings: { ...(await b.storage.local.get("settings")).settings, theme: "dark" } }));
      await waitFor(mgr, `document.documentElement.dataset.theme === "dark"`).catch(async e => {
        throw new Error(e.message + " / settings: " + JSON.stringify(await api(mgr, async b => b.storage.local.get("settings"))));
      });
      await mgr.screenshot({ path: path.join(root, "dist-e2e", `manager-${kind}.png`) }).catch(() => {});
    });

    if (isFx) popup = null;
  } finally {
    await browser.close();
  }
  return failed;
}

let failed = 0;
for (const kind of ["chrome", "firefox", "edge"]) {
  if (only.length ? !only.includes(kind) : kind === "edge") continue;
  console.log(`\n${kind}`);
  try {
    failed += await run(kind);
  } catch (e) {
    failed++;
    console.log(`  ✗ could not run: ${e.stack}`);
  }
}
server.close();
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
