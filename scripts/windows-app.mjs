#!/usr/bin/env node
/**
 * Windows PWA helper: wait until the local preview answers, then open
 * Edge/Chrome as an --app window (no address bar).
 *
 *   node scripts/windows-app.mjs open
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const URL = process.env.FM_APP_URL || "http://127.0.0.1:8081/";
const TIMEOUT_MS = Number(process.env.FM_APP_WAIT_MS || 60000);

function edgeChrome() {
  const local = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
  const pf = process.env.ProgramFiles || "C:\\Program Files";
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const candidates = [
    join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
    join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
    join(local, "Google", "Chrome", "Application", "chrome.exe"),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

async function waitFor(url, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function openApp(url) {
  const bin = edgeChrome();
  if (bin) {
    const child = spawn(bin, [`--app=${url}`, "--new-window"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
    console.log(`Opened app window with ${bin}`);
    return;
  }
  spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", shell: false }).unref();
  console.log("Edge/Chrome not found — opened the default browser.");
}

const action = process.argv[2] || "open";
if (action !== "open") {
  console.error("usage: node scripts/windows-app.mjs open");
  process.exit(1);
}

if (platform() !== "win32") {
  console.log("Windows app window helper — run this from deploy/windows/run.bat on a Windows PC.");
  process.exit(0);
}

if (!(await waitFor(URL, TIMEOUT_MS))) {
  console.error(`Preview did not answer at ${URL}. Double-click deploy.bat first.`);
  process.exit(1);
}
openApp(URL);
