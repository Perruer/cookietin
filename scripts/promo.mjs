// Renders Edge Add-ons promotional tiles into store/.
//   node scripts/promo.mjs   (after npm run media)
import { readFile, mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";

const icon = await readFile(new URL("../src/icons/icon.svg", import.meta.url), "utf8");
const shot = (await readFile(new URL("../docs/screenshots/en/01-manager.png", import.meta.url))).toString("base64");

const tile = (w, h, big) => `<!DOCTYPE html><html><body style="margin:0">
<div style="width:${w}px;height:${h}px;box-sizing:border-box;overflow:hidden;position:relative;
  background:radial-gradient(circle at 18% 30%, #eef7fa, #cfe6ee 75%);color:#13303b;
  font-family:'Segoe UI',system-ui,sans-serif;display:flex;align-items:center;
  padding:0 ${big ? 90 : 32}px;gap:${big ? 40 : 18}px">
  <div style="width:${big ? 170 : 92}px;height:${big ? 170 : 92}px;flex:none;filter:drop-shadow(0 8px 18px rgba(10,60,80,.25))">${icon.replace(/width="128" height="128"/, 'width="100%" height="100%"')}</div>
  <div style="flex:none;max-width:${big ? 470 : 260}px">
    <div style="font-size:${big ? 72 : 36}px;font-weight:700;letter-spacing:-1px;line-height:1">CookieTin</div>
    <div style="font-size:${big ? 27 : 16}px;line-height:1.3;margin-top:${big ? 16 : 9}px;color:#1f6f8b">Every cookie, in one tin.<br>View, edit, protect, export.</div>
  </div>
  ${big ? `<img src="data:image/png;base64,${shot}" style="position:absolute;left:830px;top:40px;width:720px;border-radius:12px;box-shadow:0 20px 60px rgba(10,45,60,.35);transform:rotate(-2.5deg)">` : ""}
</div></body></html>`;

await mkdir("store", { recursive: true });
const browser = await puppeteer.launch();
const page = await browser.newPage();
for (const [w, h, name] of [[440, 280, "promo-small-440x280.png"], [1400, 560, "promo-large-1400x560.png"]]) {
  await page.setViewport({ width: w, height: h });
  await page.setContent(tile(w, h, w > 1000));
  await page.screenshot({ path: `store/${name}`, clip: { x: 0, y: 0, width: w, height: h } });
  console.log("wrote store/" + name);
}
await browser.close();
