#!/usr/bin/env node
/**
 * Opaque navy-tile source → official `tauri icon` set (RGBA .ico, Android
 * mipmaps, store logos). RGB PNG-in-ICO and rounded-corner alpha both paint
 * as a white square on the Windows desktop / Start backplate.
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICONS = join(ROOT, "src-tauri", "icons");
const WIN = platform() === "win32";
const NAVY = "#243542";
const CREAM = "#f6f3ec";

function drawHtml(size) {
  return `<!doctype html><canvas id="c" width="${size}" height="${size}"></canvas>
<script>
const size = ${size};
const ctx = document.getElementById("c").getContext("2d", { alpha: false });
ctx.fillStyle = "${NAVY}";
ctx.fillRect(0, 0, size, size);
const px = (n) => Math.round((n * size) / 16);
ctx.fillStyle = "${CREAM}";
ctx.fillRect(px(3), px(3), px(10), Math.max(2, px(2)));
const w = Math.max(2, px(2));
const h = px(8);
const y = px(6);
ctx.fillRect(px(3), y, w, h);
ctx.fillRect(px(7), y, w, h);
ctx.fillRect(px(11), y, w, h);
</script>`;
}

const browser = await chromium.launch({ args: ["--disable-gpu"] });
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function pngAt(size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(drawHtml(size), { waitUntil: "load" });
  return Buffer.from(await page.screenshot({ type: "png", omitBackground: false }));
}

mkdirSync(ICONS, { recursive: true });
writeFileSync(join(ICONS, "icon-source.png"), await pngAt(1024));
const png192 = await pngAt(192);
const png180 = await pngAt(180);
await browser.close();

writeFileSync(
  join(ICONS, "icon-manifest.json"),
  `${JSON.stringify({ default: "icon-source.png", bg_color: NAVY }, null, 2)}\n`,
);

const icon = spawnSync(WIN ? "npx.cmd" : "npx", ["tauri", "icon", join(ICONS, "icon-manifest.json"), "-o", ICONS], {
  cwd: ROOT,
  stdio: "inherit",
  shell: WIN,
  env: process.env,
});
if ((icon.status ?? 1) !== 0) {
  console.error("tauri icon failed");
  process.exit(1);
}

const publicDir = join(ROOT, "public");
const grok = join(publicDir, "__grok");
mkdirSync(grok, { recursive: true });
copyFileSync(join(ICONS, "32x32.png"), join(publicDir, "icon-32.png"));
copyFileSync(join(ICONS, "icon.png"), join(publicDir, "icon-512.png"));
copyFileSync(join(ICONS, "icon.ico"), join(publicDir, "favicon.ico"));
writeFileSync(join(publicDir, "icon-192.png"), png192);
writeFileSync(join(grok, "icon-180.png"), png180);
console.log("Icons ready (Tauri RGBA ico + web rasters).");
