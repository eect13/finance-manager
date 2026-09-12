import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeBooks } from "./normalize.ts";
import { payEmployee } from "./actions.ts";
import {
  estimate13thMonth,
  monthsWorkedInYear,
  paycheckStatutoryParts,
  vatSummaryRows,
  withholding1601cRows,
} from "./ph-bir.ts";
import type { FinanceData } from "./types.ts";

function books(): FinanceData {
  return normalizeBooks({
    settings: { companyName: "Test Co", currency: "PHP", fiscalYearStart: 1, taxEnabled: true, defaultTaxRate: 12 },
    banks: [
      {
        id: "bank-op",
        name: "Operating",
        nickname: "Operating",
        accountNumber: "1",
        openingBalance: 5_000_000,
        accountId: "acc-op",
        archived: false,
      },
    ],
    accounts: [
      { id: "acc-op", code: "1000", name: "Cash — Operating", type: "asset", bankId: "bank-op", system: true },
      { id: "acc-equity", code: "3000", name: "Opening Balance Equity", type: "equity", system: true },
      { id: "acc-pay", code: "5300", name: "Payroll", type: "expense", system: true },
    ],
    employees: [
      {
        id: "emp-1",
        name: "Juan Dela Cruz",
        title: "Clerk",
        email: "",
        phone: "",
        payType: "salary",
        rate: 3_000_000,
        bankId: "bank-op",
        hireDate: "2026-04-10",
        payPeriod: "monthly",
        statutory: true,
        active: true,
        notes: "",
        sortOrder: 0,
      },
    ],
  });
}

describe("13th month / 1601-C helpers", () => {
  it("counts inclusive months (hire day still counts the month)", () => {
    assert.equal(monthsWorkedInYear("2026-04-10", 2026, "2026-09-12"), 6);
    assert.equal(monthsWorkedInYear("2025-01-01", 2026, "2026-12-31"), 12);
    assert.equal(monthsWorkedInYear("2026-11-01", 2026, "2026-09-01"), 0);
  });

  it("pro-rata estimate uses months × rate / 12 when nothing posted", () => {
    const data = books();
    const row = estimate13thMonth(data, data.employees[0]!, 2026, "2026-09-12");
    assert.equal(row.source, "pro-rata-rate");
    assert.equal(row.monthsCounted, 6);
    assert.equal(row.estimate, Math.round((3_000_000 * 6) / 12));
  });

  it("posted paycheck gross ÷ 12 wins over rate pro-rata", () => {
    let data = books();
    data = payEmployee(data, {
      employeeId: "emp-1",
      amount: 3_000_000,
      date: "2026-05-31",
      bankId: "bank-op",
      statutory: true,
    });
    const check = data.checks.find((c) => c.employeeId === "emp-1")!;
    const parts = paycheckStatutoryParts(data, check);
    assert.ok(parts.gross === 3_000_000);
    assert.ok(parts.wht >= 0);
    const row = estimate13thMonth(data, data.employees[0]!, 2026, "2026-09-12");
    assert.equal(row.source, "posted");
    assert.equal(row.estimate, Math.round(parts.gross / 12));
    const remittance = withholding1601cRows(data, "2026-01-01", "2026-12-31");
    assert.equal(remittance.length, 1);
    assert.equal(remittance[0]!["Gross pay"], 30000);
    assert.ok(String(remittance[0]!.Note).includes("not a substitute"));
  });

  it("VAT summary CSV rows include disclaimer", () => {
    const rows = vatSummaryRows(books(), "2026-09-12");
    assert.equal(rows.length, 3);
    assert.ok(String(rows[0]!.Note).includes("BIR eFiling"));
  });
});
