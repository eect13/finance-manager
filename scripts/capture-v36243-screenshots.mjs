#!/usr/bin/env node
/**
 * Screenshot refresh for README docs/screenshots (v3.62.43).
 * Run while vite dev is on http://127.0.0.1:8080.
 * Captures desk register + phone Register Grid/List + Reconcile (uniform cards, no swipe).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FM_URL || "http://127.0.0.1:8080";
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
  await shot(page, "register.png");

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
  const p2 = await phone.newPage();
  p2.setDefaultTimeout(60_000);

  await setPhoneLayout(p2, "finance-manager-register-phone-layout", "grid");
  await setPhoneLayout(p2, "finance-manager-reconcile-phone-layout", "grid");

  await p2.goto(BASE + "/", { waitUntil: "networkidle", timeout: 120_000 });
  await p2.waitForSelector("text=Pacific Harbor", { timeout: 120_000 }).catch(() => null);
  await p2.waitForTimeout(1000);
  await shot(p2, "desk-phone.png");

  await p2.goto(BASE + "/register", { waitUntil: "networkidle", timeout: 120_000 });
  await p2.waitForTimeout(1000);
  await openViewAndPickLayout(p2, "grid");
  await p2.waitForSelector(".register-phone-card, .register-phone-list", { timeout: 30_000 }).catch(() => null);
  await p2.waitForTimeout(600);
  await shot(p2, "register-phone-grid.png");

  await openViewAndPickLayout(p2, "list");
  await p2.waitForTimeout(600);
  await shot(p2, "register-phone-list.png");

  await p2.goto(BASE + "/reconcile", { waitUntil: "networkidle", timeout: 120_000 });
  await p2.waitForTimeout(1000);
  await openViewAndPickLayout(p2, "grid");
  await p2.waitForTimeout(600);
  await shot(p2, "reconcile-phone.png");

  await phone.close();
  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
