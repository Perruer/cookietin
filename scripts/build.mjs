// Builds dist/chrome and dist/firefox from src/ with esbuild.
// Code is bundled (Preact + our modules) but NOT minified, so the output
// stays readable for store reviewers.
//
//   node scripts/build.mjs            production build
//   node scripts/build.mjs --watch    rebuild on changes
//   node scripts/build.mjs --e2e      dist-e2e/, keeps the E2E test hooks
import * as esbuild from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const watch = process.argv.includes("--watch");
const e2e = process.argv.includes("--e2e");
const outRoot = path.join(root, e2e ? "dist-e2e" : "dist");

const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const GECKO_ID = "{80cc9392-1f34-433b-9a62-1b4e67b740d4}";

const entries = {
  "background": "background/index.ts",
  "popup/popup": "popup/index.tsx",
  "manager/manager": "manager/index.tsx",
  "options/options": "options/index.tsx"
};

const STATIC = [
  "_locales",
  "icons/icon.svg", "icons/icon-16.png", "icons/icon-32.png", "icons/icon-48.png", "icons/icon-96.png", "icons/icon-128.png",
  "icons/containers",
  "ui/page.css",
  "popup/popup.html", "popup/popup.css",
  "manager/manager.html", "manager/manager.css",
  "options/options.html", "options/options.css"
];

const manifests = {
  chrome: m => ({
    ...m,
    background: { service_worker: "background.js" },
    minimum_chrome_version: "120"
  }),
  firefox: m => ({
    ...m,
    // Firefox containers.
    permissions: [...m.permissions, "contextualIdentities"],
    background: { scripts: ["background.js"] },
    browser_specific_settings: {
      gecko: {
        id: GECKO_ID,
        strict_min_version: "140.0",
        // Cookies never leave the browser.
        data_collection_permissions: { required: ["none"] }
      },
      gecko_android: { strict_min_version: "142.0" }
    }
  })
};

async function writeStatic() {
  const base = JSON.parse(await readFile(path.join(src, "manifest.json"), "utf8"));
  for (const [name, patch] of Object.entries(manifests)) {
    const out = path.join(outRoot, name);
    await mkdir(out, { recursive: true });
    for (const rel of STATIC) {
      await cp(path.join(src, rel), path.join(out, rel), { recursive: true });
    }
    // The GPL text and third-party notices travel with the package.
    for (const file of ["LICENSE", "COPYRIGHT", "THIRD_PARTY_NOTICES.md"]) await cp(path.join(root, file), path.join(out, file));
    const manifest = patch({ ...base, version: pkg.version });
    await writeFile(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  }
}

const options = target => ({
  entryPoints: Object.fromEntries(Object.entries(entries).map(([out, inp]) => [out, path.join(src, inp)])),
  outdir: path.join(outRoot, target),
  bundle: true,
  format: "iife",
  target: target === "chrome" ? "chrome120" : "firefox140",
  jsx: "automatic",
  jsxImportSource: "preact",
  minify: false,
  legalComments: "inline",
  dropLabels: e2e ? [] : ["E2E"],
  logLevel: "warning"
});

await rm(outRoot, { recursive: true, force: true });
await writeStatic();

if (watch) {
  for (const target of Object.keys(manifests)) {
    const ctx = await esbuild.context(options(target));
    await ctx.watch();
  }
  console.log("watching src/ …");
} else {
  await Promise.all(Object.keys(manifests).map(target => esbuild.build(options(target))));
  console.log(`built ${path.relative(root, outRoot)}/chrome and /firefox (v${pkg.version})`);
}
