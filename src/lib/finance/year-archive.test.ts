import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addExpense, createInvoice } from "./actions.ts";
import { trialBalance } from "./ledger.ts";
import { normalizeBooks } from "./normalize.ts";
import type { FinanceData } from "./types.ts";
import {
  archiveClosedYear,
  packAfterConfirmedSave,
  parseYearArchive,
  restoreClosedYear,
  yearArchivePayload,
} from "./year-archive.ts";

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
      { id: "cust-1", name: "Walk-up", contact: "", email: "", phone: "", address: "", terms: "Due on receipt", notes: "", sortOrder: 0 },
    ],
    employees: [
      {
        id: "emp-1",
        name: "Ada",
        title: "Clerk",
        email: "",
        phone: "",
        payType: "salary",
        rate: 100,
        bankId: "bank-op",
        hireDate: "2024-01-01",
        payPeriod: "monthly",
        statutory: false,
        active: true,
        notes: "",
        sortOrder: 0,
      },
    ],
    budgetItems: [
      { id: "bud-fees", name: "Fees", kind: "outflow", amount: 1000, cadence: "monthly", startMonth: "2024-01", accountId: "acc-fees" },
    ],
  });
}

function tb(data: FinanceData): { debit: number; credit: number } {
  const rows = trialBalance(data);
  return {
    debit: rows.reduce((s, r) => s + r.debit, 0),
    credit: rows.reduce((s, r) => s + r.credit, 0),
  };
}

describe("closed year pack", () => {
  it("moves a closed year out of the hot file and restores it with the same balances", () => {
    let data = bare();
    const closedDays = 60;
    const perDay = 50;
    for (let d = 0; d < closedDays; d += 1) {
      const date = `2024-${String(1 + Math.floor(d / 28)).padStart(2, "0")}-${String(1 + (d % 28)).padStart(2, "0")}`;
      for (let n = 0; n < perDay; n += 1) {
        data = addExpense(data, {
          bankId: "bank-op",
          date,
          amount: 100 + ((d * perDay + n) % 17) * 25,
          accountId: "acc-fees",
          memo: `y-${d}-${n}`,
        });
      }
    }
    data = addExpense(data, { bankId: "bank-op", date: "2026-03-01", amount: 999, accountId: "acc-fees", memo: "open-year" });
    data = createInvoice(data, {
      customerId: "cust-1",
      date: "2024-06-01",
      dueDate: "2024-06-15",
      lines: [{ description: "Still open", quantity: 1, unitPrice: 50_000 }],
    });
    data = { ...data, settings: { ...data.settings, closedThrough: "2025-12-31" } };
    const before = tb(data);
    assert.equal(before.debit, before.credit);
    const journalsBefore = data.journals.length;
    const packed = archiveClosedYear(data, "2025-12-31");
    assert.ok(packed.afterBytes < packed.beforeBytes / 2, `${packed.beforeBytes} → ${packed.afterBytes}`);
    assert.ok(packed.data.journals.length < journalsBefore / 5);
    assert.equal(packed.data.employees.length, 1);
    assert.equal(packed.data.budgetItems.length, 1);
    assert.equal(packed.data.invoices.length, 1);
    assert.ok(packed.data.journals.some((j) => j.sourceType === "condensed" && j.sourceId === "2025-12-31"));
    assert.ok(packed.data.journals.some((j) => j.date === "2026-03-01"));
    const after = tb(packed.data);
    assert.equal(after.debit, before.debit);
    assert.equal(after.credit, before.credit);
    const roundTrip = parseYearArchive(yearArchivePayload(packed.archive));
    const restored = restoreClosedYear(packed.data, roundTrip);
    assert.equal(restored.journals.length, journalsBefore);
    assert.equal(restored.employees.length, 1);
    assert.equal(restored.budgetItems.length, 1);
    const back = tb(restored);
    assert.equal(back.debit, before.debit);
    assert.equal(back.credit, before.credit);
    assert.throws(() => restoreClosedYear(restored, roundTrip), /already in the open file/);
    assert.throws(() => archiveClosedYear(data, "2026-12-31"), /Close the books/);
  });
});

describe("packAfterConfirmedSave", () => {
  it("does not purge when the year file only fell back to a download", async () => {
    let purged = 0;
    const out = await packAfterConfirmedSave(
      async () => "downloaded",
      () => {
        purged += 1;
        return { removed: 3, beforeBytes: 10, afterBytes: 5 };
      },
    );
    assert.equal(purged, 0);
    assert.deepEqual(out, { how: "downloaded", packed: null });
  });

  it("purges once after a confirmed save", async () => {
    let purged = 0;
    const out = await packAfterConfirmedSave(
      async () => "saved",
      () => {
        purged += 1;
        return { removed: 3, beforeBytes: 10, afterBytes: 5 };
      },
    );
    assert.equal(purged, 1);
    assert.deepEqual(out, { how: "saved", packed: { removed: 3, beforeBytes: 10, afterBytes: 5 } });
  });

  it("does not purge when the save throws (cancelled picker)", async () => {
    let purged = 0;
    await assert.rejects(
      packAfterConfirmedSave(
        async () => {
          throw new DOMException("cancelled", "AbortError");
        },
        () => {
          purged += 1;
          return { removed: 3, beforeBytes: 10, afterBytes: 5 };
        },
      ),
      { name: "AbortError" },
    );
    assert.equal(purged, 0);
  });
});
