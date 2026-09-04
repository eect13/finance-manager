#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(ROOT, "src-tauri", "icons", "android");
const res = join(ROOT, "src-tauri", "gen", "android", "app", "src", "main", "res");
if (!existsSync(src)) { console.log("no icons/android"); process.exit(0); }
if (!existsSync(res)) { console.log("no gen/android res"); process.exit(0); }
let n = 0;
for (const name of readdirSync(src)) {
  const from = join(src, name);
  const to = join(res, name);
  if (!statSync(from).isDirectory()) continue;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  n += 1;
}
console.log("Synced navy launcher icons (" + n + " res folders)");
