import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, parseAmountToCents } from "./format.ts";
import { normalizeBooks } from "./normalize.ts";
import { addExpense, postReconAdjustment } from "./actions.ts";
import type { FinanceData } from "./types.ts";

function bareBooks(): FinanceData {
  return normalizeBooks({
    settings: { companyName: "Test Co", currency: "PHP", fiscalYearStart: 1 },
    banks: [
      {
        id: "bank-op",
        name: "Operating",
        nickname: "Operating",
        accountNumber: "1",
        openingBalance: 0,
        accountId: "acc-op",
        archived: false,
      },
    ],
    accounts: [
      { id: "acc-op", code: "1000", name: "Cash — Operating", type: "asset", bankId: "bank-op", system: true },
      { id: "acc-equity", code: "3000", name: "Opening Balance Equity", type: "equity", system: true },
      { id: "acc-sales", code: "4000", name: "Sales & Service Income", type: "income", system: true },
      { id: "acc-fees", code: "5500", name: "Professional Fees", type: "expense", system: true },
    ],
  });
}

describe("amount integrity (pesos string → cents ledger → display)", () => {
  it("parseAmountToCents maps pesos strings to integer cents", () => {
    assert.equal(parseAmountToCents("100"), 10000);
    assert.equal(parseAmountToCents("100.50"), 10050);
    assert.equal(parseAmountToCents("100.5"), 10050);
    assert.equal(parseAmountToCents("1,000.50"), 100050);
    assert.equal(parseAmountToCents("0.01"), 1);
    assert.equal(parseAmountToCents("-25.10"), -2510);
    assert.equal(parseAmountToCents(""), 0);
  });

  it("formatMoney shows ledger cents as pesos", () => {
    assert.match(formatMoney(10000, "PHP"), /100\.00/);
    assert.match(formatMoney(10050, "PHP"), /100\.50/);
    assert.equal(formatMoney(10000, ""), "100.00");
  });

  it("addExpense stores cents from parseAmountToCents without a second *100", () => {
    const cents = parseAmountToCents("100");
    assert.equal(cents, 10000);
    const next = addExpense(bareBooks(), {
      bankId: "bank-op",
      date: "2026-09-01",
      amount: cents,
      accountId: "acc-fees",
      memo: "Bank service charge",
    });
    const journal = next.journals.at(-1)!;
    assert.equal(journal.lines.find((l) => l.accountId === "acc-fees")?.debit, 10000);
    assert.equal(journal.lines.find((l) => l.accountId === "acc-op")?.credit, 10000);
    assert.match(formatMoney(10000, next.settings.currency), /100\.00/);
  });

  it("recon fee posts cents once; audit detail uses formatMoney (not raw 10000)", () => {
    const cents = parseAmountToCents("100");
    const { data } = postReconAdjustment(bareBooks(), {
      bankId: "bank-op",
      date: "2026-09-01",
      amount: cents,
      kind: "fee",
    });
    const journal = data.journals.at(-1)!;
    assert.equal(journal.lines.find((l) => l.debit > 0)?.debit, 10000);
    const audit = data.audit.at(-1)!;
    assert.equal(audit.action, "recon-adj");
    assert.match(audit.detail, /Service charge/);
    assert.match(audit.detail, /100\.00/);
    assert.doesNotMatch(audit.detail, /\b10000\b/);
    assert.match(String(audit.new), /100\.00/);
  });

  it("recon interest posts deposit cents once with formatted audit", () => {
    const cents = parseAmountToCents("12.34");
    const { data } = postReconAdjustment(bareBooks(), {
      bankId: "bank-op",
      date: "2026-09-01",
      amount: cents,
      kind: "interest",
    });
    const journal = data.journals.at(-1)!;
    assert.equal(journal.lines.find((l) => l.accountId === "acc-op")?.debit, 1234);
    const audit = data.audit.at(-1)!;
    assert.match(audit.detail, /Interest/);
    assert.match(audit.detail, /12\.34/);
    assert.doesNotMatch(audit.detail, /\b1234\b/);
  });
});
