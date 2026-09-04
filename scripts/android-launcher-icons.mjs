#!/usr/bin/env node
/**
 * Regenerate Android adaptive / legacy launcher mipmaps with safe-zone padding.
 * Tauri `icon` fills the canvas edge-to-edge; OEM masks then crop the mark.
 * Mark is ~44% of adaptive FG (legacy ~54%) so OEM masks leave a calm navy frame.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src-tauri", "icons", "android");
const NAVY = [0x24, 0x35, 0x42, 255];
const CREAM = [0xf6, 0xf3, 0xec, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([len, typeB, data, crcB]);
}

function pngRGBA(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawMark(size, markFrac) {
  const rgba = Buffer.alloc(size * size * 4);
  const fill = (x0, y0, w, h, c) => {
    const x1 = Math.max(0, Math.floor(x0));
    const y1 = Math.max(0, Math.floor(y0));
    const x2 = Math.min(size, Math.ceil(x0 + w));
    const y2 = Math.min(size, Math.ceil(y0 + h));
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        const i = (y * size + x) * 4;
        rgba[i] = c[0];
        rgba[i + 1] = c[1];
        rgba[i + 2] = c[2];
        rgba[i + 3] = c[3];
      }
    }
  };
  fill(0, 0, size, size, NAVY);
  const unitsW = 10;
  const unitsH = 11;
  const scale = (size * markFrac) / unitsW;
  const ox = (size - unitsW * scale) / 2;
  const oy = (size - unitsH * scale) / 2;
  const u = (n) => n * scale;
  const barH = Math.max(2, Math.round(u(2)));
  const pillarW = Math.max(2, Math.round(u(2)));
  const pillarH = Math.round(u(8));
  fill(ox + u(0), oy + u(0), u(10), barH, CREAM);
  const py = oy + u(3);
  for (const px of [0, 4, 8]) fill(ox + u(px), py, pillarW, pillarH, CREAM);
  return rgba;
}

const DENSITIES = {
  "mipmap-mdpi": { launcher: 48, foreground: 108 },
  "mipmap-hdpi": { launcher: 72, foreground: 162 },
  "mipmap-xhdpi": { launcher: 96, foreground: 216 },
  "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

for (const [folder, sizes] of Object.entries(DENSITIES)) {
  const dir = join(OUT, folder);
  mkdirSync(dir, { recursive: true });
  const fg = pngRGBA(sizes.foreground, sizes.foreground, drawMark(sizes.foreground, 0.40));
  writeFileSync(join(dir, "ic_launcher_foreground.png"), fg);
  const full = pngRGBA(sizes.launcher, sizes.launcher, drawMark(sizes.launcher, 0.50));
  writeFileSync(join(dir, "ic_launcher.png"), full);
  writeFileSync(join(dir, "ic_launcher_round.png"), full);
}

console.log("Android launcher icons: adaptive FG mark 40%, legacy 50% (safe zone).");
