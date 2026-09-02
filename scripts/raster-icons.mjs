#!/usr/bin/env node
/**
 * Rasterize the navy-tile mark to PWA + Tauri PNGs and a Windows BMP .ico.
 * PNG-in-ICO (Playwright RGB PNG) is a white square in Explorer / shortcuts.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));

/** 32-bit BMP DIB (bottom-up BGRA + AND mask). What Explorer actually reads. */
function bmp32(size, rgba) {
  const xor = size * size * 4;
  const andRow = Math.ceil(size / 32) * 4;
  const buf = Buffer.alloc(40 + xor + andRow * size);
  buf.writeUInt32LE(40, 0);
  buf.writeInt32LE(size, 4);
  buf.writeInt32LE(size * 2, 8);
  buf.writeUInt16LE(1, 12);
  buf.writeUInt16LE(32, 14);
  buf.writeUInt32LE(0, 16);
  buf.writeUInt32LE(xor, 20);
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

const DRAW = `
function drawMark(ctx, size) {
  const px = (n) => Math.round((n * size) / 16);
  ctx.fillStyle = "#243542";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, Math.max(2, px(3)));
  ctx.fill();
  ctx.fillStyle = "#f6f3ec";
  ctx.fillRect(px(3), px(3), px(10), Math.max(2, px(2)));
  const w = Math.max(2, px(2));
  const h = px(8);
  const y = px(6);
  ctx.fillRect(px(3), y, w, h);
  ctx.fillRect(px(7), y, w, h);
  ctx.fillRect(px(11), y, w, h);
}
`;

const browser = await chromium.launch({ args: ["--disable-gpu"] });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
await page.setContent(
  `<!doctype html><html><body><canvas id="c"></canvas><script>
  ${DRAW}
  window.raster = (size) => {
    const canvas = document.getElementById("c");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { alpha: false });
    drawMark(ctx, size);
    const d = ctx.getImageData(0, 0, size, size).data;
    let bin = "";
    for (let i = 0; i < d.length; i++) bin += String.fromCharCode(d[i]);
    return { png: canvas.toDataURL("image/png").slice(22), rgba: btoa(bin) };
  };
  </script></body></html>`,
  { waitUntil: "load" },
);

const png = {};
const rgba = {};
for (const size of [16, 24, 32, 48, 128, 180, 192, 256, 512]) {
  const out = await page.evaluate((s) => window.raster(s), size);
  png[size] = Buffer.from(out.png, "base64");
  rgba[size] = Buffer.from(out.rgba, "base64");
  console.log(`  raster ${size}×${size} png ${png[size].length}B`);
}
await browser.close();

const publicDir = join(ROOT, "public");
const grok = join(publicDir, "__grok");
const tauri = join(ROOT, "src-tauri", "icons");
mkdirSync(grok, { recursive: true });
mkdirSync(tauri, { recursive: true });

writeFileSync(join(publicDir, "icon-32.png"), png[32]);
writeFileSync(join(publicDir, "icon-192.png"), png[192]);
writeFileSync(join(publicDir, "icon-512.png"), png[512]);
writeFileSync(join(grok, "icon-180.png"), png[180]);
writeFileSync(join(tauri, "32x32.png"), png[32]);
writeFileSync(join(tauri, "128x128.png"), png[128]);
writeFileSync(join(tauri, "128x128@2x.png"), png[256]);
writeFileSync(join(tauri, "icon.png"), png[512]);

const ico = icoFromBmp(
  [16, 24, 32, 48, 256].map((size) => ({ size, buf: bmp32(size, rgba[size]) })),
);
writeFileSync(join(tauri, "icon.ico"), ico);
writeFileSync(join(publicDir, "favicon.ico"), ico);
console.log(`Icons ready (bmp ico ${ico.length} bytes).`);
