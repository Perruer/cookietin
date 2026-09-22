// Takes the README / store screenshots (1280×800, EN and RU) with fictional
// demo cookies. Nothing is sent anywhere: the "sites" are a local server.
//
//   node scripts/media.mjs
import http from "node:http";
import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const W = 1280;
const H = 800;

const DEMO_SITE = `<!doctype html><meta charset="utf-8"><title>Tin & Crumb — bakery shop</title>
<style>
  body { margin: 0; font: 16px/1.5 Georgia, serif; background: #fbf6ef; color: #3a2a1c; }
  header { display: flex; align-items: center; gap: 28px; padding: 18px 48px; background: #fff; border-bottom: 1px solid #eadfcf; }
  header b { font-size: 24px; } header span { color: #8a7560; font-family: system-ui; font-size: 14px; }
  main { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; padding: 40px 48px; }
  .hero { grid-column: 1 / -1; background: linear-gradient(120deg, #f3d9b1, #e8b77a); border-radius: 18px; padding: 48px; }
  .hero h1 { margin: 0 0 8px; font-size: 40px; } .card { background: #fff; border-radius: 14px; padding: 18px; height: 180px; border: 1px solid #eadfcf; }
  .dot { width: 70px; height: 70px; border-radius: 50%; background: #d9973d; margin-bottom: 12px; }
</style>
<header><b>Tin & Crumb</b><span>Cookies</span><span>Gift tins</span><span>About</span><span style="margin-left:auto">Cart (2)</span></header>
<main><div class="hero"><h1>Freshly baked, every morning</h1><p>Butter cookies in reusable tins. Free delivery over €30.</p></div>
<div class="card"><div class="dot"></div>Chocolate chip</div><div class="card"><div class="dot" style="background:#b8752a"></div>Oat & raisin</div><div class="card"><div class="dot" style="background:#e9c46a"></div>Lemon shortbread</div></main>
<script>document.cookie = "cart_id=c7f3a9e2; path=/; max-age=864000"; document.cookie = "currency=EUR; path=/; max-age=864000"; localStorage.setItem("recently_viewed", "[12,7,31]");</script>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(DEMO_SITE);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const PORT = server.address().port;
const SHOP = `http://shop.example:${PORT}/`;

const b = spawnSync(process.execPath, [path.join(root, "scripts/build.mjs")], { stdio: "inherit" });
if (b.status) process.exit(1);

const b64 = s => Buffer.from(s).toString("base64url");
const jwt = b64(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." +
  b64(JSON.stringify({ sub: "u_48213", name: "Alex", role: "customer", exp: 1893456000 })) + ".Qm9ndXMgc2lnbmF0dXJlIGZvciB0aGUgZGVtbw";

/** Fictional cookies for the demo (values are made up). */
function demoCookies(exp) {
  const c = (url, name, value, extra = {}) => ({ url, name, value, expirationDate: exp, ...extra });
  return [
    c("https://github.com/", "_gh_sess", "Kx8%2Fq3vN0bPz7Yw1eR5tL2mJ9aHs4dF6gC", { httpOnly: true, secure: true, expirationDate: undefined, sameSite: "lax" }),
    c("https://github.com/", "logged_in", "yes", { domain: ".github.com", secure: true, httpOnly: true, sameSite: "lax" }),
    c("https://github.com/", "user_session", "a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ", { secure: true, httpOnly: true, sameSite: "lax" }),
    c("https://github.com/", "dotcom_user", "octocat", { domain: ".github.com", secure: true, httpOnly: true, sameSite: "lax" }),
    c("https://github.com/", "color_mode", "%7B%22color_mode%22%3A%22auto%22%2C%22light_theme%22%3A%7B%22name%22%3A%22light%22%7D%7D", { domain: ".github.com", secure: true, sameSite: "lax" }),
    c("https://github.com/", "tz", "Europe%2FBerlin", { secure: true, sameSite: "lax" }),
    c("https://www.youtube.com/", "PREF", "f6=40000000&tz=Europe.Berlin", { domain: ".youtube.com", secure: true }),
    c("https://www.youtube.com/", "VISITOR_INFO1_LIVE", "xR4dLm0pQzY", { domain: ".youtube.com", secure: true, httpOnly: true, sameSite: "no_restriction" }),
    c("https://www.youtube.com/", "YSC", "p9Zk3LwQeTs", { domain: ".youtube.com", secure: true, httpOnly: true, sameSite: "no_restriction", expirationDate: undefined }),
    c("https://www.google.com/", "NID", "511=Tq2x8GmLr0vY3kPz", { domain: ".google.com", secure: true, httpOnly: true, sameSite: "no_restriction" }),
    c("https://www.google.com/", "SOCS", "CAISHAgBEhJnd3NfMjAyNjA5MTgtMF9SQzIaAmVuIAEaBgiAqp-2Bg", { domain: ".google.com", secure: true, sameSite: "lax" }),
    c("https://www.google.com/", "AEC", "AVh_V2g1kT9sQ", { domain: ".google.com", secure: true, httpOnly: true, sameSite: "lax" }),
    c("https://stackoverflow.com/", "prov", "4f3c2a1b-8d7e-4c6b-9a0f-1e2d3c4b5a69", { domain: ".stackoverflow.com", httpOnly: true, secure: true }),
    c("https://shop.example/", "auth_token", jwt, { secure: true, httpOnly: true, sameSite: "strict" }),
    c("https://shop.example/", "consent", "analytics=0&ads=0", { secure: true, sameSite: "lax" }),
    c("https://news.example/", "consent", "v2:essential", { secure: true, sameSite: "lax" }),
    c("https://video.example/", "vid_session", "Hk29aLq0", { secure: true, sameSite: "no_restriction", partitionKey: { topLevelSite: "https://news.example" } }),
    c("https://maps.example/", "embed_pref", "zoom=12", { secure: true, sameSite: "no_restriction", partitionKey: { topLevelSite: "https://news.example" } })
  ];
}

async function launch(lang) {
  const browser = await puppeteer.launch({
    browser: "chrome",
    headless: true,
    pipe: true,
    enableExtensions: [path.join(root, "dist/chrome")],
    args: [`--lang=${lang}`, "--no-proxy-server", `--host-resolver-rules=MAP shop.example 127.0.0.1`, `--window-size=${W},${H}`],
    defaultViewport: { width: W, height: H }
  });
  const sw = await browser.waitForTarget(t => t.type() === "service_worker" && t.url().startsWith("chrome-extension://"));
  return { browser, base: sw.url().split("/").slice(0, 3).join("/") };
}

async function open(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  // Screenshots in the light theme regardless of the OS setting (06 sets dark itself).
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.goto(url);
  await page.bringToFront();
  await sleep(500);
  return page;
}

const q = (page, expr) => page.evaluate(`(() => { const $ = s => document.querySelector(s); const $$ = s => [...document.querySelectorAll(s)]; const v = (${expr}); return v && v.nodeType ? true : v; })()`);
const click = (page, sel, mods = {}) => q(page, `$(${JSON.stringify(sel)}).dispatchEvent(new MouseEvent("click", { bubbles: true, ...${JSON.stringify(mods)} }))`);
const shot = (page, file) => page.screenshot({ path: file, captureBeyondViewport: false });

async function scenes(lang) {
  const out = path.join(root, "docs/screenshots", lang);
  await mkdir(out, { recursive: true });
  const { browser, base } = await launch(lang);
  try {
    for (const p of await browser.pages()) if (p.url() === "about:blank") await p.close().catch(() => {});
    const shop = await open(browser, SHOP);
    const bg = await shop.screenshot({ encoding: "base64", captureBeyondViewport: false });

    const mgr = await open(browser, `${base}/manager/manager.html`);
    const exp = Math.floor(Date.now() / 1000) + 180 * 86400;
    await mgr.evaluate(async list => {
      for (const d of list) await chrome.cookies.set(d);
      await chrome.storage.local.set({ protected_cookies: { "github.com": ["user_session"], ".github.com": ["logged_in", "dotcom_user"] } });
    }, demoCookies(exp).map(d => JSON.parse(JSON.stringify(d))));

    // 01 — manager with github.com and a protected cookie open
    await mgr.reload();
    await sleep(900);
    await click(mgr, `#domain-list li[data-domain="github.com"]`);
    await sleep(200);
    await click(mgr, `#cookie-list li[data-name="user_session"]`);
    await sleep(400);
    await shot(mgr, path.join(out, "01-manager.png"));

    // 02 — JWT decoded in the editor
    await mgr.goto(`${base}/manager/manager.html?q=shop.example`);
    await sleep(900);
    await click(mgr, `#cookie-list li[data-name="auth_token"]`);
    await sleep(300);
    await q(mgr, `$(".jwt").open = true`);
    await sleep(200);
    await shot(mgr, path.join(out, "02-editor-jwt.png"));

    // 03 — popup over the shop page
    const tabId = await mgr.evaluate(async url => (await chrome.tabs.query({})).find(t => t.url === url)?.id, SHOP);
    const pop = await open(browser, `${base}/popup/popup.html?tab=${tabId}`);
    await sleep(600);
    await pop.addStyleTag({ content: `
      html { background: url(data:image/png;base64,${bg}) no-repeat top left / ${W}px ${H}px; min-height: ${H}px; }
      body { width: ${W}px; height: ${H}px; background: transparent; overflow: hidden; }
      main { position: absolute; top: 10px; right: 24px; width: 360px; background: var(--bg); border-radius: 12px;
             box-shadow: 0 14px 40px rgba(40, 25, 10, .35), 0 0 0 1px rgba(0,0,0,.08); }` });
    await sleep(300);
    await shot(pop, path.join(out, "03-popup.png"));
    await pop.close();

    // 04 — export as cookies.txt
    await mgr.goto(`${base}/manager/manager.html?q=youtube.com`);
    await sleep(900);
    await click(mgr, "#export");
    await sleep(300);
    await q(mgr, `(() => { const s = $("#export-format"); s.value = "netscape"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await sleep(300);
    await shot(mgr, path.join(out, "04-export.png"));
    await q(mgr, `(() => { const s = $("#export-format"); s.value = "json"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await sleep(200);

    // 05 — settings
    const opts = await open(browser, `${base}/options/options.html`);
    await opts.evaluate(async () => chrome.storage.local.set({ settings: { ...((await chrome.storage.local.get("settings")).settings || {}), cleanupHours: 6, deleteOnStartup: true } }));
    await sleep(500);
    await shot(opts, path.join(out, "05-settings.png"));
    await opts.evaluate(async () => chrome.storage.local.set({ settings: { ...((await chrome.storage.local.get("settings")).settings || {}), cleanupHours: 0, deleteOnStartup: false } }));
    await opts.close();

    // 06 — dark theme, partitioned cookies, several selected
    await mgr.evaluate(async () => chrome.storage.local.set({ settings: { ...((await chrome.storage.local.get("settings")).settings || {}), theme: "dark" } }));
    await mgr.goto(`${base}/manager/manager.html?q=news.example`);
    await sleep(900);
    await click(mgr, `#cookie-list li[data-name="vid_session"]`);
    await click(mgr, `#cookie-list li[data-name="embed_pref"]`, { ctrlKey: true });
    await sleep(300);
    await shot(mgr, path.join(out, "06-dark-partitioned.png"));
    await mgr.evaluate(async () => chrome.storage.local.set({ settings: { ...((await chrome.storage.local.get("settings")).settings || {}), theme: "auto" } }));
    console.log("screenshots:", lang);
  } finally {
    await browser.close();
  }
}

await scenes("en");
await scenes("ru");
server.close();
