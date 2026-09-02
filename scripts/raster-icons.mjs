#!/usr/bin/env node
/** Rasterize public/favicon.svg to PWA + Tauri PNGs and a Windows .ico (navy tile). */
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const NAVY = "#243542";

function svgAt(size) {
  const raw = readFileSync(join(ROOT, "public", "favicon.svg"), "utf8");
  return raw.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
}

/** PNG-in-ICO (Vista+). Windows installers need this file or the exe is a white square. */
function pngsToIco(images) {
  const count = images.length;
  const header = 6 + 16 * count;
  let offset = header;
  const entries = images.map(({ size, buf }) => {
    const entry = { size, buf, offset };
    offset += buf.length;
    return entry;
  });
  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);
  let p = 6;
  for (const e of entries) {
    out.writeUInt8(e.size >= 256 ? 0 : e.size, p);
    out.writeUInt8(e.size >= 256 ? 0 : e.size, p + 1);
    out.writeUInt8(0, p + 2);
    out.writeUInt8(0, p + 3);
    out.writeUInt16LE(1, p + 4);
    out.writeUInt16LE(32, p + 6);
    out.writeUInt32LE(e.buf.length, p + 8);
    out.writeUInt32LE(e.offset, p + 12);
    p += 16;
  }
  for (const e of entries) e.buf.copy(out, e.offset);
  return out;
}

const browser = await chromium.launch({ args: ["--disable-gpu"] });
const png = {};

async function raster(size) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:${NAVY};}
      svg{display:block;width:${size}px;height:${size}px;}
    </style></head><body>${svgAt(size)}</body></html>`,
    { waitUntil: "load" },
  );
  const buf = Buffer.from(await page.screenshot({ type: "png", omitBackground: false }));
  await page.close();
  png[size] = buf;
  return buf;
}

for (const size of [16, 32, 48, 128, 180, 192, 256, 512]) {
  await raster(size);
  console.log(`  raster ${size}×${size} (${png[size].length} bytes)`);
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

const ico = pngsToIco([
  { size: 16, buf: png[16] },
  { size: 32, buf: png[32] },
  { size: 48, buf: png[48] },
  { size: 256, buf: png[256] },
]);
writeFileSync(join(tauri, "icon.ico"), ico);
writeFileSync(join(publicDir, "favicon.ico"), ico);
console.log(`Icons ready (ico ${ico.length} bytes).`);
