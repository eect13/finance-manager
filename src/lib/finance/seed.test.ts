import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
  });
});
