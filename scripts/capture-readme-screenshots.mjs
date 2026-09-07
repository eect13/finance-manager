#!/usr/bin/env node
/**
 * README gallery. Run while `npm run dev` is on :8080.
 *   node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FM_URL || "http://127.0.0.1:8080";
const OUT = join(process.cwd(), "docs/screenshots");
mkdirSync(OUT, { recursive: true });

async function waitApp(page) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector("text=Pacific Harbor", { timeout: 120_000 });
  await page.waitForTimeout(1500);
  await page.keyboard.press("Escape").catch(() => {});
}

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false, animations: "disabled" });
  console.log("wrote", path);
}

async function go(page, path) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector("text=Pacific Harbor", { timeout: 60_000 }).catch(() => null);
  await page.waitForTimeout(1400);
  await page.keyboard.press("Escape").catch(() => {});
}

const browser = await chromium.launch({ headless: true });

const desk = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const page = await desk.newPage();
page.setDefaultTimeout(60_000);
console.log("desk…");
await waitApp(page);
await shot(page, "desk.png");
await go(page, "/register");
await shot(page, "register.png");
await go(page, "/reports");
await shot(page, "reports.png");
await go(page, "/reconcile");
await shot(page, "reconcile.png");
await go(page, "/employees");
await page.waitForSelector("text=Ana Reyes", { timeout: 30_000 });
await page.waitForTimeout(400);
await shot(page, "employees.png");
await go(page, "/settings");
await page.evaluate(() => {
  const sc = document.querySelector("[data-workspace-scroll]") || document.scrollingElement;
  if (sc) sc.scrollTop = 0;
  document.getElementById("opt-profile")?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(400);
await shot(page, "options.png");
await desk.close();

const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: "light",
});
const p = await phone.newPage();
p.setDefaultTimeout(60_000);
console.log("phone…");
await waitApp(p);
await shot(p, "desk-phone.png");
await p.evaluate(() => {
  localStorage.setItem("finance-manager-register-phone-layout", "list");
});
await go(p, "/register");
await p.waitForTimeout(800);
await shot(p, "register-phone.png");
await phone.close();

await browser.close();
console.log("done");
