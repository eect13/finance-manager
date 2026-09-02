#!/usr/bin/env node
/**
 * Build Finance Manager for the web (PWA).
 *
 *   1. Check Node 22
 *   2. npm install
 *   3. npm run build  → dist/
 *   4. Open that folder
 *
 *   This is not a Tauri .exe. Remix from Grok publishes the app.
 *
 *   node scripts/deploy.mjs
 *   node scripts/deploy.mjs --no-open
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const WIN = platform() === "win32";
const noOpen = process.argv.includes("--no-open");

function log(step, msg) {
  console.log(`\n[${step}] ${msg}`);
}

function fail(msg, extra) {
  console.error(`\n✗ ${msg}`);
  if (extra) console.error(extra);
  process.exit(1);
}

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
    env: process.env,
  });
  return r.status ?? 1;
}

console.log("Finance Manager deploy — web / PWA. First time is slow; leave this window open.\n");
console.log("  This builds a production folder (dist/), not a desktop installer.");
console.log("  Remix from Grok is how you publish. Other PCs need a browser, not Node.\n");

log("1/4", "Tools");
const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  fail(`Node.js 22+ required (you have ${process.version}).`, "https://nodejs.org — LTS installer.");
}
console.log(`  Node ${process.version}`);

log("2/4", "Install dependencies");
if (run("npm", ["install"]) !== 0) fail("npm install failed.");

log("3/4", "Production build");
if (run("npm", ["run", "build"]) !== 0) fail("Build failed.");

const distDir = join(ROOT, "dist");
const vercelDir = join(ROOT, ".vercel", "output");
if (!existsSync(distDir) && !existsSync(vercelDir)) fail("No dist/ or .vercel/output. The build did not finish.");
mkdirSync(distDir, { recursive: true });
writeFileSync(
  join(distDir, "README.txt"),
  "This is the production build for Finance Manager.\r\n\r\nDo not open these files as file:// — modules will not load.\r\nDouble-click run.bat (Windows) to serve it in an Edge/Chrome app window.\r\nFor a folder of index.html snapshots: npm run deploy:web → web\\\r\n",
);

log("4/4", "Open output folder");
if (!noOpen) {
  if (WIN) spawnSync("explorer", [distDir], { shell: true, stdio: "ignore" });
  else if (platform() === "darwin") spawnSync("open", [distDir], { stdio: "ignore" });
  else spawnSync("xdg-open", [distDir], { stdio: "ignore" });
}
console.log(`  ${distDir}`);

console.log(`
Done. Output is in dist\\
Windows: double-click run.bat — Edge/Chrome opens as an app window, then Install app.
Android: deploy\\android\\apk.bat (needs a published https URL + Android SDK, or PWABuilder).
Web snapshot: npm run deploy:web → web\\index.html
Publish with Remix from Grok. This is a browser / PWA ledger, not a Tauri .exe.
`);
