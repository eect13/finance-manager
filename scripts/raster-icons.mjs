#!/usr/bin/env node
/**
 * Opaque navy-tile source → official `tauri icon` set (android/icns/pngs),
 * then a Windows **BMP** .ico. PNG-in-ICO is a white square on the shortcut
 * and the taskbar (Explorer does not paint PNG entries at 16/32/48). Rounded
 * corners on a white backplate were the same white plate — the tile is a
 * full opaque square; Windows 11 rounds it.
 *
 * ICO pixels are drawn in Node (not canvas getImageData — Chromium headless
 * often returns a black buffer for alpha:false canvases).
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
const NAVY_RGB = [0x24, 0x35, 0x42];
const CREAM_RGB = [0xf6, 0xf3, 0xec];
const ICO_SIZES = [16, 24, 32, 48, 64, 256];

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

/** Same mark as the canvas, as RGBA — used for the BMP .ico. */
function rgbaAt(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const px = (n) => Math.round((n * size) / 16);
  const fill = (x, y, w, h, rgb) => {
    const x1 = Math.max(0, x);
    const y1 = Math.max(0, y);
    const x2 = Math.min(size, x + w);
    const y2 = Math.min(size, y + h);
    for (let yy = y1; yy < y2; yy++) {
      for (let xx = x1; xx < x2; xx++) {
        const i = (yy * size + xx) * 4;
        rgba[i] = rgb[0];
        rgba[i + 1] = rgb[1];
        rgba[i + 2] = rgb[2];
        rgba[i + 3] = 255;
      }
    }
  };
  fill(0, 0, size, size, NAVY_RGB);
  fill(px(3), px(3), px(10), Math.max(2, px(2)), CREAM_RGB);
  const w = Math.max(2, px(2));
  const h = px(8);
  const y = px(6);
  fill(px(3), y, w, h, CREAM_RGB);
  fill(px(7), y, w, h, CREAM_RGB);
  fill(px(11), y, w, h, CREAM_RGB);
  if (rgba[0] !== NAVY_RGB[0] || rgba[1] !== NAVY_RGB[1] || rgba[2] !== NAVY_RGB[2]) {
    throw new Error("navy tile raster produced a non-navy pixel");
  }
  return rgba;
}

/** 32-bit BMP DIB (bottom-up BGRA + zero AND mask). What Explorer reads. */
function bmp32(size, rgba) {
  const xor = size * size * 4;
  const andRow = Math.ceil(size / 32) * 4;
  const buf = Buffer.alloc(40 + xor + andRow * size);
  buf.writeUInt32LE(40, 0);
  buf.writeInt32LE(size, 4);
  buf.writeInt32LE(size * 2, 8);
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  let o = 40;
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      buf[o++] = rgba[i + 2];
      buf[o++] = rgba[i + 1];
      buf[o++] = rgba[i];
      buf[o++] = 255;
    }
  }
  return buf;
}

function icoFromBmp(images) {
  const header = 6 + 16 * images.length;
  const out = Buffer.alloc(header + images.reduce((s, im) => s + im.buf.length, 0));
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(images.length, 4);
  let p = 6;
  let offset = header;
  for (const im of images) {
    out.writeUInt8(im.size >= 256 ? 0 : im.size, p);
    out.writeUInt8(im.size >= 256 ? 0 : im.size, p + 1);
    out.writeUInt8(0, p + 2);
    out.writeUInt8(0, p + 3);
    out.writeUInt16LE(1, p + 4);
    out.writeUInt16LE(32, p + 6);
    out.writeUInt32LE(im.buf.length, p + 8);
    out.writeUInt32LE(offset, p + 12);
    p += 16;
    im.buf.copy(out, offset);
    offset += im.buf.length;
  }
  return out;
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

const ico = icoFromBmp(ICO_SIZES.map((size) => ({ size, buf: bmp32(size, rgbaAt(size)) })));
const firstOff = ico.readUInt32LE(18);
if (ico.readUInt32LE(firstOff) !== 40) {
  console.error("ico first image is not a BMP DIB (Explorer would show a white square)");
  process.exit(1);
}
// First pixel of the 16×16 DIB is bottom-left BGRA — must be navy, not black/white.
const b = ico[firstOff + 40];
const g = ico[firstOff + 41];
const r = ico[firstOff + 42];
if (r !== NAVY_RGB[0] || g !== NAVY_RGB[1] || b !== NAVY_RGB[2]) {
  console.error(`ico pixel is rgb(${r},${g},${b}), expected navy`);
  process.exit(1);
}
writeFileSync(join(ICONS, "icon.ico"), ico);

const publicDir = join(ROOT, "public");
const grok = join(publicDir, "__grok");
mkdirSync(grok, { recursive: true });
copyFileSync(join(ICONS, "32x32.png"), join(publicDir, "icon-32.png"));
copyFileSync(join(ICONS, "icon.png"), join(publicDir, "icon-512.png"));
writeFileSync(join(publicDir, "favicon.ico"), ico);
writeFileSync(join(publicDir, "icon-192.png"), png192);
writeFileSync(join(grok, "icon-180.png"), png180);

const androidIcons = spawnSync(process.execPath, [join(ROOT, "scripts", "android-launcher-icons.mjs")], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});
if ((androidIcons.status ?? 1) !== 0) {
  console.error("android-launcher-icons failed");
  process.exit(1);
}

console.log(`Icons ready (BMP ico ${ico.length}B + Tauri png/android).`);
