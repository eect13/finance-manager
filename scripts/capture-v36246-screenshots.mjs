#!/usr/bin/env node
/**
 * Screenshot refresh for v3.62.46 check status menu.
 * Run while vite is on FM_URL (default http://127.0.0.1:8081).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FM_URL || "http://127.0.0.1:8081";
const OUT = join(process.cwd(), "docs/screenshots");
mkdirSync(OUT, { recursive: true });

async function waitApp(page) {
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForSelector("text=Pacific Harbor", { timeout: 120_000 }).catch(() => null);
  await page.waitForTimeout(1200);
}

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  console.log("wrote", path);
}

async function setPhoneLayout(page, key, layout) {
  await page.evaluate(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [key, layout],
  );
}

async function openViewAndPickLayout(page, layout) {
  const viewBtn = page
    .getByRole("button", { name: /View options/i })
    .or(page.getByRole("button", { name: /^View$/i }))
    .first();
  if (await viewBtn.count()) {
    await viewBtn.click().catch(() => null);
    await page.waitForTimeout(400);
    const name = layout === "list" ? /List rows/i : /Grid cards/i;
    const layoutBtn = page.getByRole("button", { name }).first();
    if (await layoutBtn.count()) {
      await layoutBtn.click().catch(() => null);
      await page.waitForTimeout(300);
    }
    await page.keyboard.press("Escape").catch(() => null);
    await page.waitForTimeout(500);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desk = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await desk.newPage();
  page.setDefaultTimeout(60_000);

  console.log("loading app…");
  await waitApp(page);

  await page.goto(BASE + "/register", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1200);
  // Open check status menu on first Check badge if present
  const checkBadge = page.getByRole("button", { name: /Check status/i }).first();
  if (await checkBadge.count()) {
    await checkBadge.click().catch(() => null);
    await page.waitForTimeout(400);
  }
  await shot(page, "register.png");
  await page.keyboard.press("Escape").catch(() => null);

  await page.goto(BASE + "/checks", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1000);
  const more = page.getByRole("button", { name: /^More$/i }).first();
  if (await more.count()) {
    await more.click().catch(() => null);
    await page.waitForTimeout(400);
  }
  await shot(page, "checks-status.png");
  await page.keyboard.press("Escape").catch(() => null);

  await desk.close();

  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const p2 = await phone.newPage();
  p2.setDefaultTimeout(60_000);
  await setPhoneLayout(p2, "finance-manager-register-phone-layout", "grid");
  await waitApp(p2);
  await p2.goto(BASE + "/register", { waitUntil: "networkidle", timeout: 120_000 });
  await p2.waitForTimeout(1000);
  await openViewAndPickLayout(p2, "grid");
  await p2.waitForSelector(".register-phone-card, .register-phone-list", { timeout: 30_000 }).catch(() => null);
  await p2.waitForTimeout(500);
  await shot(p2, "register-phone-grid.png");

  await setPhoneLayout(p2, "finance-manager-register-phone-layout", "list");
  await openViewAndPickLayout(p2, "list");
  await p2.waitForTimeout(600);
  await shot(p2, "register-phone-list.png");

  await phone.close();
  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
