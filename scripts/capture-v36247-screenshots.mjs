#!/usr/bin/env node
/**
 * Screenshot refresh for v3.62.47 receipt status + reconcile ticks.
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
  const receiptBadge = page.getByRole("button", { name: /Receipt status/i }).first();
  if (await receiptBadge.count()) {
    await receiptBadge.click().catch(() => null);
    await page.waitForTimeout(400);
  }
  await shot(page, "register.png");
  await page.keyboard.press("Escape").catch(() => null);

  await page.goto(BASE + "/receipts", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1000);
  const statusChip = page.getByRole("button", { name: /Receipt status/i }).first();
  if (await statusChip.count()) {
    await statusChip.click().catch(() => null);
    await page.waitForTimeout(400);
  }
  await shot(page, "receipts-status.png");
  await page.keyboard.press("Escape").catch(() => null);

  await page.goto(BASE + "/reconcile", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1200);
  await shot(page, "reconcile.png");

  await desk.close();

  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const pp = await phone.newPage();
  pp.setDefaultTimeout(60_000);
  await waitApp(pp);

  await pp.goto(BASE + "/register", { waitUntil: "networkidle", timeout: 120_000 });
  await pp.waitForTimeout(1000);
  await openViewAndPickLayout(pp, "list");
  await pp.waitForTimeout(600);
  const phoneReceipt = pp.getByRole("button", { name: /Receipt status/i }).first();
  if (await phoneReceipt.count()) {
    await phoneReceipt.click().catch(() => null);
    await pp.waitForTimeout(400);
  }
  await shot(pp, "register-phone-list.png");
  await pp.keyboard.press("Escape").catch(() => null);

  await openViewAndPickLayout(pp, "grid");
  await pp.waitForTimeout(600);
  await shot(pp, "register-phone-grid.png");

  await pp.goto(BASE + "/reconcile", { waitUntil: "networkidle", timeout: 120_000 });
  await pp.waitForTimeout(1000);
  await openViewAndPickLayout(pp, "list");
  await pp.waitForTimeout(600);
  await shot(pp, "reconcile-phone.png");

  await phone.close();
  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
