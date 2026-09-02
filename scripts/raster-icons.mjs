#!/usr/bin/env node
/** Rasterize public/favicon.svg to PWA + Tauri PNGs (navy tile, never a white square). */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));

function svgAt(size) {
  const raw = readFileSync(join(ROOT, "public", "favicon.svg"), "utf8");
  return raw.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
}

async function raster(size, file) {
  const browser = await chromium.launch({ args: ["--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:#243542">${svgAt(size)}</body></html>`,
    { waitUntil: "load" },
  );
  const buf = await page.screenshot({ type: "png", omitBackground: false });
  await browser.close();
  writeFileSync(file, buf);
  console.log(`  wrote ${file} (${size}×${size})`);
}

const out32 = join(ROOT, "public", "icon-32.png");
const out192 = join(ROOT, "public", "icon-192.png");
const out512 = join(ROOT, "public", "icon-512.png");
const out180 = join(ROOT, "public", "__grok", "icon-180.png");
const tauri = join(ROOT, "src-tauri", "icons");
mkdirSync(tauri, { recursive: true });

await raster(32, out32);
await raster(192, out192);
await raster(512, out512);
await raster(180, out180);
await raster(32, join(tauri, "32x32.png"));
await raster(128, join(tauri, "128x128.png"));
await raster(256, join(tauri, "128x128@2x.png"));
copyFileSync(out512, join(tauri, "icon.png"));
console.log("Icons ready.");
