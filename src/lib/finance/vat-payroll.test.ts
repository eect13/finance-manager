import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeBooks } from "./normalize.ts";
import { createBill, createCashSale, payEmployee, updateReceipt } from "./actions.ts";
import { invoiceSubtotal } from "./ledger.ts";
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
        openingBalance: 0,
        accountId: "acc-op",
        archived: false,
      },
    ],
    accounts: [
      { id: "acc-op", code: "1000", name: "Cash — Operating", type: "asset", bankId: "bank-op", system: true },
      { id: "acc-ar", code: "1200", name: "Accounts Receivable", type: "asset", system: true },
      { id: "acc-ap", code: "2000", name: "Accounts Payable", type: "liability", system: true },
      { id: "acc-equity", code: "3000", name: "Opening Balance Equity", type: "equity", system: true },
      { id: "acc-sales", code: "4000", name: "Sales & Service Income", type: "income", system: true },
      { id: "acc-opex", code: "5000", name: "Operating Expenses", type: "expense", system: true },
      { id: "acc-pay", code: "5300", name: "Payroll", type: "expense", system: true },
    ],
    customers: [{ id: "cust-1", name: "Acme", contact: "", email: "", phone: "", address: "", terms: "", notes: "", sortOrder: 0 }],
    vendors: [{ id: "vend-1", name: "Globe", contact: "", email: "", phone: "", address: "", terms: "", notes: "", accountNumber: "", sortOrder: 0 }],
    employees: [
      {
        id: "emp-1",
        name: "Hourly Ana",
        title: "Clerk",
        email: "",
        phone: "",
        payType: "hourly",
        rate: 15000,
        bankId: "bank-op",
        hireDate: "2026-01-01",
        active: true,
        notes: "",
        sortOrder: 0,
      },
    ],
  });
}

describe("input VAT on bills", () => {
  it("splits a taxed bill into expense net + input VAT + AP gross", () => {
    const next = createBill(books(), {
      vendorId: "vend-1",
      date: "2026-09-01",
      dueDate: "2026-09-15",
      amount: 11200,
      accountId: "acc-opex",
      memo: "Supplies",
      reference: "",
      taxRate: 12,
    });
    const bill = next.bills.at(-1)!;
    assert.equal(bill.amount, 11200);
    assert.equal(bill.taxRate, 12);
    const journal = next.journals.find((j) => j.id === bill.journalId)!;
    const vat = next.accounts.find((a) => a.code === "1300")!;
    const expense = journal.lines.find((l) => l.accountId === "acc-opex")!;
    const inputVat = journal.lines.find((l) => l.accountId === vat.id)!;
    const ap = journal.lines.find((l) => l.accountId === "acc-ap")!;
    assert.equal(expense.debit, 10000);
    assert.equal(inputVat.debit, 1200);
    assert.equal(ap.credit, 11200);
    assert.equal(
      journal.lines.reduce((s, l) => s + l.debit, 0),
      journal.lines.reduce((s, l) => s + l.credit, 0),
    );
  });
});

describe("taxed cash-sale line rescale", () => {
  it("rescales receipt.lines when Register edits the gross amount", () => {
    let data = createCashSale(books(), {
      bankId: "bank-op",
      customerId: "cust-1",
      date: "2026-09-01",
      method: "cash",
      notes: "",
      taxRate: 12,
      lines: [{ description: "Widget", quantity: 1, unitPrice: 10000 }],
    });
    const receipt = data.receipts.at(-1)!;
    assert.equal(receipt.amount, 11200);
    assert.equal(invoiceSubtotal(receipt.lines), 10000);
    data = updateReceipt(data, receipt.id, { amount: 22400 });
    const updated = data.receipts.find((r) => r.id === receipt.id)!;
    assert.equal(updated.amount, 22400);
    assert.equal(invoiceSubtotal(updated.lines), 20000);
    const journal = data.journals.find((j) => j.id === updated.journalId)!;
    assert.equal(
      journal.lines.reduce((s, l) => s + l.debit, 0),
      journal.lines.reduce((s, l) => s + l.credit, 0),
    );
  });
});

describe("payroll hours and withholding", () => {
  it("hourly paycheck is hours × rate", () => {
    const next = payEmployee(books(), {
      employeeId: "emp-1",
      hours: 8,
      date: "2026-09-01",
      bankId: "bank-op",
    });
    const check = next.checks.at(-1)!;
    assert.equal(check.amount, 120000);
    const journal = next.journals.find((j) => j.id === check.journalId)!;
    assert.equal(journal.lines.find((l) => l.accountId === "acc-pay")?.debit, 120000);
    assert.equal(journal.lines.find((l) => l.accountId === "acc-op")?.credit, 120000);
  });

  it("optional withholding is a 3-line journal; check is net", () => {
    const next = payEmployee(books(), {
      employeeId: "emp-1",
      amount: 100000,
      withholding: 10000,
      date: "2026-09-01",
      bankId: "bank-op",
    });
    const check = next.checks.at(-1)!;
    assert.equal(check.amount, 90000);
    const journal = next.journals.find((j) => j.id === check.journalId)!;
    const hold = next.accounts.find((a) => a.code === "2210")!;
    assert.equal(journal.lines.find((l) => l.accountId === "acc-pay")?.debit, 100000);
    assert.equal(journal.lines.find((l) => l.accountId === "acc-op")?.credit, 90000);
    assert.equal(journal.lines.find((l) => l.accountId === hold.id)?.credit, 10000);
    assert.equal(
      journal.lines.reduce((s, l) => s + l.debit, 0),
      journal.lines.reduce((s, l) => s + l.credit, 0),
    );
  });
});
