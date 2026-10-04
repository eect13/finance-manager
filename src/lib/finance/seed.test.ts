import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { postDueRecurring } from "./actions.ts";
import { deskCloseLine } from "./close.ts";
import { cashForecast } from "./forecast.ts";
import { formatDate } from "./format.ts";
import { invoiceBalance } from "./ledger.ts";
import { normalizeBooks } from "./normalize.ts";
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
    assert.ok(oct1.outflows >= pending + bills);
    const extra = oct1.outflows - pending - bills;
    // Payroll / rent halves match existing cash. Untagged-or-unmatched lines (e.g. utilities with no ₱19,500 twin) may still fill.
    assert.ok(extra === 0 || extra === 1_950_000, `unexpected extra outflow ${extra}`);
    const dueThatDay = data.invoices
      .filter((i) => (i.status === "sent" || i.status === "partial") && i.dueDate === "2026-10-01")
      .reduce((s, i) => s + invoiceBalance(data, i.id), 0);
    assert.ok(oct1.inflows >= dueThatDay);
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

describe("forecast honesty", () => {
  function books() {
    return normalizeBooks({
      settings: { companyName: "Gap Co", currency: "PHP", forecastDays: 90 },
      banks: [
        {
          id: "bank-op",
          name: "Operating",
          nickname: "Operating",
          accountNumber: "1",
          openingBalance: 1_000_000,
          accountId: "acc-op",
          archived: false,
        },
      ],
      accounts: [
        { id: "acc-op", code: "1000", name: "Cash", type: "asset", bankId: "bank-op", system: true },
        { id: "acc-ar", code: "1200", name: "AR", type: "asset", system: true },
        { id: "acc-sales", code: "4000", name: "Sales", type: "income", system: true },
        { id: "acc-pay", code: "5300", name: "Payroll", type: "expense", system: true },
        { id: "acc-eq", code: "3000", name: "Equity", type: "equity", system: true },
      ],
      customers: [{ id: "c1", name: "Buyer", contact: "", email: "", phone: "", address: "", terms: "", notes: "", sortOrder: 0 }],
      budgetItems: [
        { id: "sales", name: "Trade sales", kind: "inflow", amount: 1_000, cadence: "monthly", startMonth: "2026-01", accountId: "acc-sales" },
        { id: "pay", name: "Payroll", kind: "outflow", amount: 200, cadence: "monthly", startMonth: "2026-01", accountId: "acc-pay" },
      ],
      invoices: [
        {
          id: "inv-old",
          number: "1",
          customerId: "c1",
          date: "2026-08-01",
          dueDate: "2026-08-15",
          status: "sent",
          taxRate: 0,
          notes: "",
          journalId: "",
          lines: [{ id: "l1", description: "Old", quantity: 1, unitPrice: 400 }],
          payments: [],
        },
        {
          id: "inv-oct",
          number: "2",
          customerId: "c1",
          date: "2026-10-01",
          dueDate: "2026-10-15",
          status: "sent",
          taxRate: 0,
          notes: "",
          journalId: "",
          lines: [{ id: "l2", description: "Oct", quantity: 1, unitPrice: 400 }],
          payments: [],
        },
      ],
      checks: [
        {
          id: "chk-half",
          bankId: "bank-op",
          checkNumber: "1",
          payee: "Staff payroll",
          issueDate: "2026-10-13",
          postDate: "2026-10-14",
          amount: 100,
          status: "pending",
          memo: "1st half",
          accountId: "acc-pay",
          journalId: "",
        },
      ],
      bills: [
        {
          id: "bill-old",
          number: "B1",
          vendorId: "v1",
          date: "2026-08-01",
          dueDate: "2026-08-20",
          amount: 50,
          accountId: "acc-pay",
          status: "open",
          memo: "",
          reference: "",
          payments: [],
          journalId: "",
        },
      ],
    });
  }

  it("parks overdue open items on the start date and leaves only the uncovered gap", () => {
    const data = books();
    const points = cashForecast(data, 20, "2026-10-02");
    const start = points[0]!;
    const oct15 = points.find((p) => p.date === "2026-10-15")!;
    const halfDay = points.find((p) => p.date === "2026-10-14")!;
    assert.equal(start.date, "2026-10-02");
    // Overdue invoice 400 lands today. October sales gap is 600 (budget 1,000 − invoice 400).
    assert.equal(start.inflows, 1_000);
    assert.equal(oct15.inflows, 400);
    // Overdue bill 50 plus the uncovered payroll half (100) land today. The posted half stays on its date.
    assert.equal(start.outflows, 150);
    assert.equal(halfDay.outflows, 100);
    const monthOut = points.filter((p) => p.date.startsWith("2026-10")).reduce((s, p) => s + p.outflows, 0);
    assert.equal(monthOut, 250);
  });

  it("does not let a shared word or an exact amount on another account cover rent", () => {
    const data = books();
    data.accounts.push(
      { id: "acc-rent", code: "5400", name: "Rent", type: "expense", system: false },
      { id: "acc-util", code: "5410", name: "Utilities", type: "expense", system: false },
    );
    data.budgetItems.push({
      id: "rent",
      name: "Warehouse rent",
      kind: "outflow",
      amount: 500,
      cadence: "monthly",
      startMonth: "2026-01",
      accountId: "acc-rent",
    });
    data.bills.push({
      id: "power",
      number: "B2",
      vendorId: "v1",
      date: "2026-10-01",
      dueDate: "2026-10-05",
      amount: 500,
      accountId: "acc-util",
      status: "open",
      memo: "warehouse power",
      reference: "",
      payments: [],
      journalId: "",
      sortOrder: 0,
      taxRate: 0,
    });
    const points = cashForecast(data, 10, "2026-10-02");
    const start = points[0]!;
    const powerDay = points.find((p) => p.date === "2026-10-05")!;
    assert.equal(start.outflows, 650);
    assert.equal(powerDay.outflows, 500);
  });
});

describe("desk close banner", () => {
  it("does not repeat the through date", () => {
    const through = "2026-10-31";
    const when = formatDate(through);
    const blocker = `Statements stop at ${formatDate("2026-07-31")}. Finish one through ${when} to close.`;
    const line = deskCloseLine(through, blocker);
    assert.equal(line.split(when).length - 1, 1);
    assert.equal(line.includes("cannot close yet"), false);
  });
});
