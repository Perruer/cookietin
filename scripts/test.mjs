// Runs test/unit/*.test.ts with node:test (Node 20 can't glob --test args).
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = readdirSync("test/unit").filter(f => f.endsWith(".test.ts")).map(f => `test/unit/${f}`);
const r = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], { stdio: "inherit" });
process.exit(r.status ?? 1);
