// Creates dist/cookietin-source-<version>.zip for the addons.mozilla.org
// source code review, from the last commit (git archive).
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const { version } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const dirty = execFileSync("git", ["status", "--porcelain", "--", "src", "scripts", "package.json", "package-lock.json", "tsconfig.json"]).toString().trim();
if (dirty) console.warn("warning: uncommitted changes are NOT included in the source zip:\n" + dirty);

const out = `dist/cookietin-source-${version}.zip`;
execFileSync("git", ["archive", "--format=zip", `--prefix=cookietin-${version}/`, "-o", out, "HEAD", "--", ".", ":!docs", ":!store"]);
console.log("Source package ready:", out);
