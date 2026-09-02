#!/usr/bin/env node
/**
 * Windows pack (priority). Production build + a real .exe that serves the
 * static app and opens Edge/Chrome as an --app window. Not Tauri.
 *
 *   node scripts/pack-windows.mjs
 *
 * Output:
 *   dist/FinanceManager.exe  — double-click on Windows
 *   dist/app/                — HTML/JS/CSS the exe serves
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const WIN = platform() === "win32";
const DIST = join(ROOT, "dist");
const APP = join(DIST, "app");
const STATIC = join(ROOT, ".vercel", "output", "static");
const WEB = join(ROOT, "web");
const EXE = join(DIST, "FinanceManager.exe");
const DOCS = join(ROOT, "deploy", "windows");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: WIN,
    env: process.env,
    ...opts,
  });
  return r.status ?? 1;
}

console.log("Finance Manager — Windows pack (.exe)\n");

if (run("node", ["scripts/deploy.mjs", "--no-open"]) !== 0) process.exit(1);

mkdirSync(DIST, { recursive: true });
mkdirSync(DOCS, { recursive: true });

if (existsSync(APP)) rmSync(APP, { recursive: true, force: true });
mkdirSync(APP, { recursive: true });

if (existsSync(WEB)) {
  cpSync(WEB, APP, { recursive: true });
} else if (existsSync(STATIC)) {
  cpSync(STATIC, APP, { recursive: true });
} else {
  console.error("No production static output. Build failed?");
  process.exit(1);
}

const readme = `# Windows (priority)

\`deploy.bat\` builds **FinanceManager.exe**. Double-click the exe (or \`run.bat\`).

The exe is a small local server plus Edge/Chrome **app window** (no address bar). It is not Tauri, not an MSI, and not a Microsoft Store listing. Books stay in this Windows user profile until you download a backup.

## One-click on this PC

1. Double-click \`deploy.bat\` at the repo root (or this folder).
2. When it finishes, double-click \`run.bat\` — or \`dist\\FinanceManager.exe\`.
3. Edge (or Chrome) opens as an app window. **⋯ → Install app** pins it to the taskbar.

Node 22 is required **to build**. Running the exe on another PC does not need Node — keep \`FinanceManager.exe\` and the \`app\\\` folder next to each other.

## What you get

| File | Role |
| --- | --- |
| \`dist/FinanceManager.exe\` | Local server + opens Edge/Chrome \`--app\` |
| \`dist/app/\` | HTML / JS / CSS the exe serves (do not separate from the exe) |
| \`run.bat\` | Starts the exe if present, otherwise the production preview |
| \`deploy.bat\` | \`npm install\` + production build + exe |

If the exe packer is missing on this machine, \`dist/app\` is still written and \`run.bat\` opens the preview as an app window.
`;

writeFileSync(join(DOCS, "README.md"), readme);
writeFileSync(join(DIST, "README.md"), readme);

let packed = false;
const pkgBin = existsSync(join(ROOT, "node_modules", ".bin", "pkg"))
  ? join(ROOT, "node_modules", ".bin", "pkg")
  : null;

if (!pkgBin) {
  console.log("Installing @yao-pkg/pkg (Windows exe packer)…");
  const install = run("npm", ["install", "--no-save", "--no-audit", "@yao-pkg/pkg"]);
  if (install !== 0) console.warn("Could not install pkg — exe will be skipped; app folder is still ready.");
}

const pkg = existsSync(join(ROOT, "node_modules", ".bin", "pkg"))
  ? join(ROOT, "node_modules", ".bin", WIN ? "pkg.cmd" : "pkg")
  : "pkg";

const pkgArgs = [
  join(ROOT, "scripts", "win-launcher.cjs"),
  "--targets",
  "node22-win-x64",
  "--output",
  EXE,
  "--compress",
  "GZip",
];

console.log("Packing FinanceManager.exe…");
if (run(pkg, pkgArgs) === 0 && existsSync(EXE)) {
  packed = true;
  console.log(`Wrote ${EXE}`);
} else {
  console.warn("pkg did not write an .exe (network or target unavailable). dist/app is ready.");
  writeFileSync(
    join(DIST, "FinanceManager.cmd"),
    `@echo off\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul && node "%~dp0..\\scripts\\win-launcher.cjs" & goto :eof\r\necho Node.js is required if the .exe is missing.\r\npause\r\n`,
  );
}

if (!WIN) {
  console.log(`
Windows pack written to dist/
On a Windows PC: double-click deploy.bat, then run.bat or dist\\FinanceManager.exe.
${packed ? "FinanceManager.exe is a Windows x64 binary (built here)." : "Rebuild on Windows if the .exe is missing."}
Keep dist\\app next to the exe.
`);
} else {
  console.log(`
Done. Double-click run.bat or dist\\FinanceManager.exe
Then Install app (Edge ⋯ menu) to pin it.
`);
}
