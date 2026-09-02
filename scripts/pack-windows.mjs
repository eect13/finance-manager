#!/usr/bin/env node
/**
 * Windows pack — Tauri installer (NSIS / MSI).
 * Kept as `npm run deploy:windows` so older docs still work.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(process.execPath, [join(ROOT, "scripts", "deploy.mjs"), ...process.argv.slice(2)], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
