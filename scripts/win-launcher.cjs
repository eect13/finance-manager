#!/usr/bin/env node
/**
 * Windows desktop launcher. Serves the static `app/` folder next to the .exe
 * and opens Edge/Chrome as an --app window (no address bar).
 *
 * Packed by scripts/pack-windows.mjs → dist/FinanceManager.exe
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const os = require("node:os");

const PORT = Number(process.env.FM_PORT || 4173);
const HOST = "127.0.0.1";

function appRoot() {
  const exeDir = path.dirname(process.execPath);
  const nextToExe = path.join(exeDir, "app");
  if (fs.existsSync(nextToExe)) return nextToExe;
  const fromWeb = path.join(process.cwd(), "web");
  if (fs.existsSync(fromWeb)) return fromWeb;
  const fromDist = path.join(process.cwd(), "dist", "app");
  if (fs.existsSync(fromDist)) return fromDist;
  return nextToExe;
}

const ROOT = appRoot();

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0] || "/");
  if (rel.endsWith("/")) rel += "index.html";
  const candidates = [
    path.join(ROOT, rel),
    path.join(ROOT, rel, "index.html"),
    path.join(ROOT, "index.html"),
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
    } catch {
      /* skip */
    }
  }
  return null;
}

function edgeChrome() {
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const pf = process.env.ProgramFiles || "C:\\Program Files";
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const candidates = [
    path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(local, "Google", "Chrome", "Application", "chrome.exe"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
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
    console.log("Opened app window.");
    return;
  }
  spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  console.log("Edge/Chrome not found — opened the default browser.");
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
    return;
  }
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(500);
      res.end("Read error");
      return;
    }
    res.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
    res.end(body);
  });
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`Finance Manager → ${url}`);
  console.log(`Serving ${ROOT}`);
  if (process.platform === "win32") openApp(url);
});
