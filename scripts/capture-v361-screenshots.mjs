#!/usr/bin/env node
/**
 * One-shot screenshot refresh for README docs/screenshots (v3.61).
 * Run while vite dev is on http://127.0.0.1:8080.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.FM_URL || "http://127.0.0.1:8080";
const OUT = join(process.cwd(), "docs/screenshots");
mkdirSync(OUT, { recursive: true });

async function waitApp(page) {
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 120_000 });
  // Wait for shell / desk content (sample company name or nav)
  await page.waitForSelector("text=Pacific Harbor", { timeout: 120_000 }).catch(() => null);
  await page.waitForTimeout(1500);
}

async function shot(page, name) {
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  console.log("wrote", path);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  console.log("loading app…");
  await waitApp(page);
  await shot(page, "desk.png");

  for (const [route, file] of [
    ["/banks", "banks.png"],
    ["/employees", "employees.png"],
    ["/reports", "reports.png"],
    ["/reconcile", "reconcile.png"],
  ]) {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(1200);
    await shot(page, file);
  }

    // Register — Cleared/Reconciled full labels + thousand separators
  await page.goto(BASE + "/register", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1200);
  const viewBtn = page.getByRole("button", { name: /View options/i }).or(page.getByRole("button", { name: /^View$/i })).first();
  if (await viewBtn.count()) {
    await viewBtn.click();
    await page.waitForTimeout(400);
    for (const label of ["Memo", "Bank", "No."]) {
      const chip = page.getByRole("button", { name: new RegExp("^Hide " + label.replace(".", "\\.") + "$") });
      if (await chip.count()) {
        await chip.click().catch(() => null);
        await page.waitForTimeout(150);
      }
    }
    await page.keyboard.press("Escape").catch(() => null);
    await page.waitForTimeout(500);
  }
  const cleared = await page.locator("text=Cleared").count();
  console.log("Cleared badges visible:", cleared);
  await shot(page, "register.png");

// Options → Currency and tax
  await page.goto(BASE + "/settings", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(800);
  const taxCard = page.locator("text=Currency and tax").first();
  await taxCard.scrollIntoViewIfNeeded().catch(() => null);
  await page.waitForTimeout(400);
  // Prefer clipping the currency/tax card if possible
  const card = page.locator("text=Currency and tax").locator("xpath=ancestor::div[contains(@class,'rounded') or contains(@class,'card')][1]");
  if (await card.count()) {
    await card.screenshot({ path: join(OUT, "options-currency-tax.png") });
    console.log("wrote options-currency-tax.png (card)");
  } else {
    await shot(page, "options-currency-tax.png");
  }
  // Options → Display / Formatting (scroll into view so formatting section is visible)
  const displayCard = page.locator("text=Display / Formatting").first();
  await displayCard.scrollIntoViewIfNeeded().catch(() => null);
  await page.waitForTimeout(400);
  await shot(page, "options.png");

  // Labeled undo toast: prefer Options switch (reliable), then Register Post
  let toastShot = false;
  {
    const switches = page.locator('button[role="switch"]');
    if (await switches.count()) {
      await switches.first().click().catch(() => null);
      await page.waitForTimeout(700);
      await page.keyboard.press("Control+z");
      await page.waitForTimeout(700);
      if (await page.locator("text=/Undid:/i").count()) {
        await shot(page, "undo-toast.png");
        toastShot = true;
      }
    }
  }
  if (!toastShot) {
  await page.goto(BASE + "/register", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(1000);
  const postBtn = page.getByRole("button", { name: /^Post$/i }).first();
  if (await postBtn.count()) {
    await postBtn.click().catch(() => null);
    await page.waitForTimeout(400);
    // Try Type dropdown → Expense
    const typeTrigger = page.locator('[role="combobox"], button').filter({ hasText: /Check|Expense|Deposit|Cash/i }).first();
    if (await typeTrigger.count()) {
      await typeTrigger.click().catch(() => null);
      await page.waitForTimeout(200);
      const expense = page.getByRole("option", { name: /Expense/i }).first();
      if (await expense.count()) await expense.click().catch(() => null);
    }
    // Amount
    const amount = page.locator('input[inputmode="decimal"], input[name="amount"], input').filter({ hasText: "" }).nth(0);
    // Fill payee / amount fields heuristically
    const inputs = page.locator("input:visible");
    const n = await inputs.count();
    for (let i = 0; i < Math.min(n, 8); i++) {
      const el = inputs.nth(i);
      const ph = ((await el.getAttribute("placeholder")) || "").toLowerCase();
      const aria = ((await el.getAttribute("aria-label")) || "").toLowerCase();
      const type = ((await el.getAttribute("type")) || "").toLowerCase();
      if (ph.includes("payee") || aria.includes("payee") || ph.includes("name")) {
        await el.fill("Screenshot payee").catch(() => null);
      } else if (ph.includes("amount") || aria.includes("amount") || type === "number") {
        await el.fill("100").catch(() => null);
      } else if (ph.includes("memo") || aria.includes("memo")) {
        await el.fill("v3.61 screenshot").catch(() => null);
      }
    }
    // Save / Post inside dialog
    const save = page.getByRole("button", { name: /^(Saved|Save|Post|Enter)$/i }).last();
    if (await save.count()) {
      await save.click().catch(() => null);
      await page.waitForTimeout(800);
    }
    // Undo
    await page.keyboard.press("Control+z");
    await page.waitForTimeout(600);
    const toast = page.locator("text=/Undid:/i").first();
    if (await toast.count()) {
      // Full page with toast visible
      await shot(page, "undo-toast.png");
      toastShot = true;
    }
  }
  }
  if (!toastShot) {
    console.log("undo toast not captured (skipped)");
  }

  // Phone desk
  await context.close();
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const p2 = await phone.newPage();
  await p2.goto(BASE + "/", { waitUntil: "networkidle", timeout: 120_000 });
  await p2.waitForSelector("text=Pacific Harbor", { timeout: 120_000 }).catch(() => null);
  await p2.waitForTimeout(1200);
  await p2.screenshot({ path: join(OUT, "desk-phone.png"), fullPage: false });
  console.log("wrote desk-phone.png");
  await phone.close();
  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
