import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "./seed.ts";

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

  it("every journal balances", () => {
    for (const j of data.journals) {
      const debit = j.lines.reduce((s, l) => s + l.debit, 0);
      const credit = j.lines.reduce((s, l) => s + l.credit, 0);
      assert.equal(debit, credit, j.id);
    }
  });
});
