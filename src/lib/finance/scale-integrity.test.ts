import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addExpense, createInvoice } from "./actions.ts";
import { cashForecast } from "./forecast.ts";
import { normalizeBooks } from "./normalize.ts";
import { trialBalance } from "./ledger.ts";
import type { FinanceData } from "./types.ts";

function bare(): FinanceData {
  return normalizeBooks({
    settings: { companyName: "Scale Co", currency: "PHP" },
    banks: [
      {
        id: "bank-op",
        name: "Operating",
        nickname: "Operating",
        accountNumber: "1",
        openingBalance: 50_000_000_00,
        accountId: "acc-op",
        archived: false,
      },
    ],
    accounts: [
      { id: "acc-op", code: "1000", name: "Cash — Operating", type: "asset", bankId: "bank-op", system: true },
      { id: "acc-equity", code: "3000", name: "Opening Balance Equity", type: "equity", system: true },
      { id: "acc-ar", code: "1200", name: "Accounts Receivable", type: "asset", system: true },
      { id: "acc-sales", code: "4000", name: "Sales", type: "income", system: true },
      { id: "acc-fees", code: "5500", name: "Fees", type: "expense", system: true },
    ],
    customers: [
      {
        id: "cust-1",
        name: "Walk-up",
        contact: "",
        email: "",
        phone: "",
        address: "",
        terms: "Due on receipt",
        notes: "",
        sortOrder: 0,
      },
    ],
  });
}

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

describe("volume integrity", () => {
  it("300 postings a day for 90 days keep journals in balance after normalize", () => {
    let data = bare();
    let expense = 0;
    const days = 90;
    const perDay = 300;
    for (let d = 0; d < days; d += 1) {
      const month = 1 + Math.floor(d / 28);
      const day = 1 + (d % 28);
      const date = iso(2026, month, day);
      for (let n = 0; n < perDay; n += 1) {
        const cents = 100 + ((d * perDay + n) % 97) * 25;
        data = addExpense(data, {
          bankId: "bank-op",
          date,
          amount: cents,
          accountId: "acc-fees",
          memo: `t-${d}-${n}`,
        });
        expense += cents;
      }
    }
    const count = days * perDay;
    assert.ok(data.journals.length >= count);
    let debit = 0;
    let credit = 0;
    for (const j of data.journals) {
      const d = j.lines.reduce((s, l) => s + l.debit, 0);
      const c = j.lines.reduce((s, l) => s + l.credit, 0);
      assert.equal(d, c, j.id);
      debit += d;
      credit += c;
    }
    assert.equal(debit, credit);
    const again = normalizeBooks(JSON.parse(JSON.stringify(data)));
    assert.equal(again.journals.length, data.journals.length);
    const tb = trialBalance(again);
    const tbD = tb.reduce((s, r) => s + r.debit, 0);
    const tbC = tb.reduce((s, r) => s + r.credit, 0);
    assert.equal(tbD, tbC);
    const path = cashForecast(again, 30, "2026-04-01");
    assert.equal(path.length, 30);
    assert.ok(Number.isFinite(path[path.length - 1]!.cash));
    assert.ok(expense > 0);
  });

  it("a 5-year monthly close sample stays integer-cents and balanced", () => {
    let data = bare();
    for (let year = 2026; year <= 2030; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const date = iso(year, month, 15);
        data = addExpense(data, {
          bankId: "bank-op",
          date,
          amount: 12_345,
          accountId: "acc-fees",
          memo: `close-${year}-${month}`,
        });
        data = createInvoice(data, {
          customerId: "cust-1",
          date,
          dueDate: iso(year, month, 28),
          lines: [{ description: "Lot", quantity: 1, unitPrice: 50_000 }],
        });
      }
    }
    const copy = normalizeBooks(JSON.parse(JSON.stringify(data)));
    assert.equal(copy.journals.length, data.journals.length);
    assert.equal(copy.invoices.length, 5 * 12);
    for (const j of copy.journals) {
      const d = j.lines.reduce((s, l) => s + l.debit, 0);
      const c = j.lines.reduce((s, l) => s + l.credit, 0);
      assert.equal(d, c, j.id);
      assert.ok(j.lines.every((l) => Number.isInteger(l.debit) && Number.isInteger(l.credit)));
    }
  });
});
