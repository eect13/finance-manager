#!/usr/bin/env node
/** Rasterize public/favicon.svg to 192 / 512 / 180 PNGs for TWA / PWA sideload. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));

function svgAt(size) {
  const raw = readFileSync(join(ROOT, "public", "favicon.svg"), "utf8");
  return raw.replace("<svg", `<svg width="${size}" height="${size}"`);
}

async function raster(size, file) {
  const browser = await chromium.launch({ args: ["--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svgAt(size)}</body></html>`, {
    waitUntil: "load",
  });
  const buf = await page.screenshot({ type: "png", omitBackground: false });
  await browser.close();
  writeFileSync(file, buf);
  console.log(`  wrote ${file} (${size}×${size})`);
}

const out192 = join(ROOT, "public", "icon-192.png");
const out512 = join(ROOT, "public", "icon-512.png");
const out180 = join(ROOT, "public", "__grok", "icon-180.png");

await raster(192, out192);
await raster(512, out512);
await raster(180, out180);
console.log("Icons ready.");
