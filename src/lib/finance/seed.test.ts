import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { postDueRecurring } from "./actions.ts";
import { cashForecast } from "./forecast.ts";
import { parseForecastDays } from "./types.ts";
import { createSeed, isOutdatedPacificHarborSample } from "./seed.ts";

describe("Pacific Harbor sample", () => {
  const data = createSeed();
  const docs = data.invoices.length + data.bills.length + data.receipts.length + data.checks.length;

  it("is a mid-size trading house, not a boutique", () => {
    assert.equal(data.settings.companyName, "Pacific Harbor Trading");
    assert.ok(data.customers.length >= 35, `customers ${data.customers.length}`);
    assert.ok(data.vendors.length >= 28, `vendors ${data.vendors.length}`);
    assert.ok(data.employees.length >= 12, `employees ${data.employees.length}`);
    assert.ok(data.employees.some((e) => e.active === false), "one inactive employee");
    assert.ok(data.employees.filter((e) => e.payType === "hourly").length >= 3, "hourly mix");
    assert.ok(docs >= 1700, `documents ${docs}`);
  });

  it("payroll lump covers the named staff, not a boutique stub", () => {
    const payBudget = data.budgetItems.find((b) => b.id === "bud-pay");
    assert.ok(payBudget && payBudget.amount >= 38_000_000, `budget ${payBudget?.amount}`);
    const halves = data.checks.filter((c) => c.payee === "Staff payroll" && /half/i.test(c.memo ?? ""));
    const thirteenth = data.checks.filter((c) => c.payee === "Staff payroll" && /13th/i.test(c.memo ?? ""));
    assert.equal(halves.length, 24, `halves ${halves.length}`);
    assert.ok(halves.every((c) => c.amount === 19_000_000));
    assert.equal(thirteenth.length, 1);
    assert.equal(thirteenth[0]?.amount, 38_000_000);
    const rec = data.recurrences.filter((r) => r.id.startsWith("rec-pay"));
    assert.equal(rec.length, 2);
    assert.ok(rec.every((r) => r.amount === 19_000_000));
    assert.ok(data.recurrences.every((r) => r.nextDate >= "2027-01-01"), "seeded year is already posted");
    assert.equal(postDueRecurring(data, "2026-09-30").posted.length, 0);
  });

  it("does not forecast budget cash that the month already posted", () => {
    const points = cashForecast(data, 40, "2026-09-27");
    const oct1 = points.find((p) => p.date === "2026-10-01");
    assert.ok(oct1);
    const pending = data.checks
      .filter((c) => c.status === "pending" && (c.postDate || c.issueDate) === "2026-10-01")
      .reduce((s, c) => s + c.amount, 0);
    const bills = data.bills
      .filter((b) => (b.status === "open" || b.status === "partial") && b.dueDate === "2026-10-01")
      .reduce((s, b) => s + b.amount, 0);
    assert.equal(oct1.outflows, pending + bills);
    assert.ok(oct1.inflows >= 62_000_000, "trade-sales budget still fills a month with no matching invoices");
  });

  it("forecast length follows the chosen horizon", () => {
    assert.equal(parseForecastDays(60), 60);
    assert.equal(parseForecastDays(7), 90);
    assert.equal(cashForecast(data, 30, "2026-09-27").length, 30);
    assert.equal(cashForecast(data, 180, "2026-09-27").length, 180);
  });

  it("every journal balances", () => {
    for (const j of data.journals) {
      const debit = j.lines.reduce((s, l) => s + l.debit, 0);
      const credit = j.lines.reduce((s, l) => s + l.credit, 0);
      assert.equal(debit, credit, j.id);
    }
  });

  it("marks fresh seed as current and boutique sizes as outdated", () => {
    assert.equal(isOutdatedPacificHarborSample(data), false);
    assert.equal(
      isOutdatedPacificHarborSample({
        customers: Array(19),
        vendors: Array(10),
        employees: Array(3),
        invoices: Array(400),
        bills: Array(300),
        receipts: Array(200),
        checks: Array(100),
      }),
      true,
    );
    assert.equal(
      isOutdatedPacificHarborSample({
        customers: Array(39),
        vendors: Array(30),
        employees: Array(14),
        invoices: Array(500),
        bills: Array(400),
        receipts: Array(400),
        checks: Array(500),
        budgetItems: [{ id: "bud-pay", amount: 25_280_000 }],
      }),
      true,
    );
    assert.equal(
      isOutdatedPacificHarborSample({
        customers: Array(39),
        vendors: Array(30),
        employees: Array(14),
        invoices: Array(500),
        bills: Array(400),
        receipts: Array(400),
        checks: Array(500),
        budgetItems: [{ id: "bud-pay", amount: 38_000_000 }],
        recurrences: [{ id: "rec-pay1", nextDate: "2026-09-13" }],
      }),
      true,
    );
  });
});
