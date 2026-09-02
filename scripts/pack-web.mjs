#!/usr/bin/env node
/**
 * Static web pack: a folder with index.html, per-route HTML, and assets.
 * The live app is still SSR (Remix / Vercel). This snapshot is for people who
 * want a whole HTML tree they can serve with any static host.
 *
 *   node scripts/pack-web.mjs
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(ROOT, "web");
const STATIC = join(ROOT, ".vercel", "output", "static");
const WIN = platform() === "win32";
const PREVIEW = "http://127.0.0.1:8081";

const ROUTES = [
  "/",
  "/register",
  "/banks",
  "/customers",
  "/vendors",
  "/invoices",
  "/bills",
  "/receipts",
  "/checks",
  "/ledger",
  "/reports",
  "/settings",
  "/forecast",
  "/calendar",
  "/reconcile",
  "/close",
];

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: WIN, env: process.env });
  return r.status ?? 1;
}

function routeFile(route) {
  if (route === "/") return join(OUT, "index.html");
  return join(OUT, route.slice(1), "index.html");
}

if (!existsSync(STATIC)) {
  console.log("No production build yet — building…");
  if (run("npm", ["run", "build"]) !== 0) process.exit(1);
}

if (run("npm", ["run", "preview:restart"]) !== 0) process.exit(1);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(STATIC, OUT, { recursive: true });

let failed = 0;
for (const route of ROUTES) {
  try {
    const res = await fetch(`${PREVIEW}${route}`);
    if (!res.ok) throw new Error(`${res.status}`);
    const html = await res.text();
    const file = routeFile(route);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    console.log(`  ${route} → ${file.slice(ROOT.endsWith("/") ? ROOT.length : ROOT.length + 1)}`);
  } catch (err) {
    failed += 1;
    console.warn(`  skip ${route}: ${err instanceof Error ? err.message : err}`);
  }
}

run("npm", ["run", "preview:stop"]);

writeFileSync(
  join(OUT, "serve.mjs"),
  `#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = join(ROOT, path);
  if (!existsSync(file)) file = join(ROOT, path, "index.html");
  if (!existsSync(file)) file = join(ROOT, "index.html");
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(PORT, "127.0.0.1", () => {
  console.log("Finance Manager static site → http://127.0.0.1:" + PORT + "/");
});
`,
);

writeFileSync(
  join(OUT, "README.md"),
  `# Web (static HTML)

This folder is a snapshot of the production app:

- \`index.html\` — desk
- \`register/index.html\`, \`banks/index.html\`, … — one HTML file per route
- \`assets/\` — hashed JS/CSS
- \`favicon.svg\`, \`og.jpg\`, \`__grok/\`

It is **not** a \`file://\` app (modules will not load). Serve the folder:

    node web/serve.mjs

Or any static host with a fallback to \`index.html\`. Remix from Grok is still the one-click publish — that uses the Vercel SSR build, not this snapshot.

Client-side navigation after the first paint uses the same JS as the live app. Books stay in the browser that opened it.
`,
);

if (failed && failed === ROUTES.length) {
  console.error("No routes could be snapshotted.");
  process.exit(1);
}

console.log(`\nWeb pack ready: ${OUT}`);
console.log("  Serve with: node web/serve.mjs");
if (failed) console.log(`  (${failed} route(s) skipped)`);
