// @ts-nocheck — restored from the last production build (types live in store.ts via typeof)
import { newId } from "./ids";
import { todayIso } from "./format";
import {
  billBalance,
  invoiceBalance,
  invoiceTax,
  invoiceTotal,
  makeJournal,
  receiptTotal,
  reverseJournal,
  invoiceSubtotal,
} from "./ledger";
import type {
  Bank,
  Bill,
  BillStatus,
  BudgetItem,
  CheckStatus,
  Customer,
  FinanceData,
  InvoiceLine,
  Receipt,
  ReceiptMethod,
  Settings,
  Vendor,
  RecurringItem,
} from "./types";
import type { CashLineKind } from "./register";
import { methodNeedsReference, methodLabel } from "./methods";
import {
  bookBalanceOn,
  explainedDifference,
  isReconAdj,
  lastReconBefore,
  lineOnFinishedRecon,
  namedFromCash,
  namedReconLines,
  reconBeginning,
  reconDifference,
  reconExplain,
  unclearedAge,
  unclearedLines,
} from "./reconcile";
import { closeChecklist, closeTotals } from "./close";
import type { AuditEvent, CloseSnapshot, ReconStatement } from "./types";
import { addMonths, format, parseISO } from "date-fns";

function assertOpenPeriod(data: FinanceData, date: string) {
  const closed = (data.settings?.closedThrough ?? "").trim();
  if (closed && date && date <= closed) {
    throw new Error(`Books are closed through ${closed}.`);
  }
}

export function addBank(data: FinanceData, input): FinanceData {
  const bankId = newId();
  const accountId = newId();
  const codeBase = 1e3 + data.banks.length * 10;
  const bank = {
    id: bankId,
    name: input.name,
    nickname: input.nickname || input.name,
    accountNumber: input.accountNumber,
    openingBalance: input.openingBalance,
    accountId,
    archived: false
  };
  const equity = data.accounts.find((a) => a.code === "3000");
  if (!equity) throw new Error("Opening equity account missing");
  const journals = [...data.journals];
  if (input.openingBalance !== 0) journals.push(makeJournal({
    date: input.date ?? todayIso(),
    description: `Opening balance — ${bank.nickname}`,
    sourceType: "opening",
    sourceId: bankId,
    lines: [{
      accountId,
      debit: Math.max(0, input.openingBalance),
      credit: Math.max(0, -input.openingBalance)
    }, {
      accountId: equity.id,
      debit: Math.max(0, -input.openingBalance),
      credit: Math.max(0, input.openingBalance)
    }]
  }));
  return {
    ...data,
    banks: [...data.banks, bank],
    accounts: [...data.accounts, {
      id: accountId,
      code: String(codeBase),
      name: `Cash — ${bank.nickname}`,
      type: "asset",
      bankId,
      system: true
    }],
    journals,
    nextNumbers: {
      ...data.nextNumbers,
      check: {
        ...data.nextNumbers.check,
        [bankId]: 1
      }
    }
  };
}
export function updateBank(data: FinanceData, id, patch): FinanceData {
  return {
    ...data,
    banks: data.banks.map((b) => b.id === id ? {
      ...b,
      ...patch
    } : b)
  };
}
export function removeBank(data: FinanceData, id): FinanceData {
  const bank = data.banks.find((b) => b.id === id);
  if (!bank) throw new Error("Bank not found");
  if (data.checks.some((c) => c.bankId === id)) throw new Error("This bank still has checks. Delete those first.");
  if (data.receipts.some((r) => r.bankId === id && r.status !== "void")) throw new Error("This bank still has receipts. Delete those first.");
  if (data.invoices.some((i) => i.payments.some((p) => p.bankId === id))) throw new Error("This bank collected invoice payments. Delete those receipts first.");
  if (data.bills.some((b) => b.payments.some((p) => p.bankId === id))) throw new Error("This bank paid vendor bills. Delete those payments first.");
  if (data.journals.filter((j) => j.lines.some((l) => l.accountId === bank.accountId) && j.sourceType !== "opening").length > 0) throw new Error("This bank still has ledger activity.");
  const { [id]: _removed, ...checkNumbers } = data.nextNumbers.check;
  return {
    ...data,
    banks: data.banks.filter((b) => b.id !== id),
    accounts: data.accounts.filter((a) => a.id !== bank.accountId && a.bankId !== id),
    journals: data.journals.filter((j) => !j.lines.some((l) => l.accountId === bank.accountId)),
    nextNumbers: {
      ...data.nextNumbers,
      check: checkNumbers
    }
  };
}
export function addCustomer(data: FinanceData, input): FinanceData {
  const sortOrder = data.customers.length;
  return {
    ...data,
    customers: [...data.customers, {
      ...input,
      id: input.id ?? newId(),
      sortOrder: input.sortOrder ?? sortOrder
    }]
  };
}
export function updateCustomer(data: FinanceData, id, patch): FinanceData {
  return {
    ...data,
    customers: data.customers.map((c) => c.id === id ? {
      ...c,
      ...patch
    } : c)
  };
}
export function removeCustomer(data: FinanceData, id): FinanceData {
  if (data.invoices.some((i) => i.customerId === id && i.status !== "void")) throw new Error("This customer has invoices. Keep the record for the books.");
  if (data.receipts.some((r) => r.customerId === id && r.status !== "void")) throw new Error("This customer has receipts. Keep the record for the books.");
  return {
    ...data,
    customers: data.customers.filter((c) => c.id !== id)
  };
}
export function reorderCustomers(data: FinanceData, ids): FinanceData {
  return {
    ...data,
    customers: applyOrder(data.customers, ids)
  };
}
export function addVendor(data: FinanceData, input): FinanceData {
  const sortOrder = data.vendors.length;
  return {
    ...data,
    vendors: [...data.vendors, {
      ...input,
      id: input.id ?? newId(),
      sortOrder: input.sortOrder ?? sortOrder
    }]
  };
}
export function updateVendor(data: FinanceData, id, patch): FinanceData {
  return {
    ...data,
    vendors: data.vendors.map((v) => v.id === id ? {
      ...v,
      ...patch
    } : v)
  };
}
export function removeVendor(data: FinanceData, id): FinanceData {
  if (data.bills.some((b) => b.vendorId === id && b.status !== "void")) throw new Error("This vendor has bills. Keep the record for the books.");
  if (data.checks.some((c) => c.vendorId === id && c.status !== "voided" && c.status !== "bounced")) {
    throw new Error("This vendor has checks. Keep the record for the books.");
  }
  return {
    ...data,
    vendors: data.vendors.filter((v) => v.id !== id)
  };
}
export function reorderVendors(data: FinanceData, ids): FinanceData {
  return {
    ...data,
    vendors: applyOrder(data.vendors, ids)
  };
}
function applyOrder(items, ids) {
  const map = new Map(items.map((item) => [item.id, item]));
  const ordered = [];
  for (const id of ids) {
    const item = map.get(id);
    if (item) {
      ordered.push({
        ...item,
        sortOrder: ordered.length
      });
      map.delete(id);
    }
  }
  for (const item of map.values()) ordered.push({
    ...item,
    sortOrder: ordered.length
  });
  return ordered;
}
export function issueCheck(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.issueDate);
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
  if (!input.vendorId || !data.vendors.some((v) => v.id === input.vendorId)) {
    throw new Error("Payee must be a registered vendor. Click + Add to create.");
  }
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");
  const next = data.nextNumbers.check[bank.id] ?? 1;
  const checkNumber = input.checkNumber?.trim() || String(next).padStart(4, "0");
  const id = newId();
  const journal = makeJournal({
    date: input.issueDate,
    description: `Check ${checkNumber} — ${input.payee}`,
    sourceType: "check",
    sourceId: id,
    lines: [{
      accountId: input.accountId,
      debit: input.amount,
      credit: 0,
      memo: input.memo
    }, {
      accountId: bank.accountId,
      debit: 0,
      credit: input.amount
    }]
  });
  return {
    ...data,
    checks: [...data.checks, {
      id,
      bankId: bank.id,
      checkNumber,
      payee: input.payee,
      issueDate: input.issueDate,
      postDate: input.postDate || input.issueDate,
      amount: input.amount,
      status: "pending",
      recon: "pending",
      memo: input.memo,
      accountId: input.accountId,
      journalId: journal.id,
      vendorId: input.vendorId,
      createdAt: journal.createdAt
    }],
    journals: [...data.journals, journal],
    nextNumbers: {
      ...data.nextNumbers,
      check: {
        ...data.nextNumbers.check,
        [bank.id]: next + 1
      }
    }
  };
}
export function setCheckStatus(data: FinanceData, id, status, date = todayIso()): FinanceData {
  const check = data.checks.find((c) => c.id === id);
  if (!check) throw new Error("Check not found");
  if (check.recon === "reconciled") throw new Error("This line is reconciled. Unlock it first.");
  if (check.status === status) return data;
  if (status === "voided" || status === "bounced") {
    if (check.status === "voided" || check.status === "bounced") return data;
    const original = data.journals.find((j) => j.id === check.journalId);
    if (!original) throw new Error("Original journal missing");
    const reversal = reverseJournal(original, date, `Check ${check.checkNumber} ${status}`);
    return {
      ...data,
      checks: data.checks.map((c) => c.id === id ? {
        ...c,
        status,
        reversalJournalId: reversal.id
      } : c),
      journals: [...data.journals, reversal]
    };
  }
  return {
    ...data,
    checks: data.checks.map((c) => c.id === id ? {
      ...c,
      status
    } : c)
  };
}
export function removeCheck(data: FinanceData, id): FinanceData {
  const check = data.checks.find((c) => c.id === id);
  if (!check) throw new Error("Check not found");
  return dropJournalsAndReversals({
    ...data,
    checks: data.checks.filter((c) => c.id !== id)
  }, [check.journalId, check.reversalJournalId]);
}
export function createInvoice(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  const customer = data.customers.find((c) => c.id === input.customerId);
  if (!customer) throw new Error("Customer not found");
  const lines = input.lines.filter((l) => l.description.trim() && l.quantity > 0).map((l) => ({
    ...l,
    id: newId(),
    unitPrice: Math.round(l.unitPrice)
  }));
  if (lines.length === 0) throw new Error("Add at least one line");
  const id = newId();
  const number = `INV-${input.date.slice(0, 4)}-${String(data.nextNumbers.invoice).padStart(3, "0")}`;
  const taxRate = input.taxRate ?? (data.settings.taxEnabled ? data.settings.defaultTaxRate : 0);
  const sub = invoiceSubtotal(lines);
  const total = sub + invoiceTax(sub, taxRate, taxRate > 0);
  const status = input.status ?? "sent";
  let journalId;
  const journals = [...data.journals];
  if (status === "sent" && total > 0) {
    const ar = data.accounts.find((a) => a.code === "1200");
    const sales = data.accounts.find((a) => a.code === "4000");
    const vat = data.accounts.find((a) => a.code === "2200");
    if (!ar || !sales) throw new Error("AR or income account missing");
    const tax = total - sub;
    const creditLines = tax > 0 && vat
      ? [
          { accountId: sales.id, debit: 0, credit: sub },
          { accountId: vat.id, debit: 0, credit: tax },
        ]
      : [{ accountId: sales.id, debit: 0, credit: total }];
    const journal = makeJournal({
      date: input.date,
      description: `Invoice ${number} — ${customer.name}`,
      sourceType: "invoice",
      sourceId: id,
      lines: [{ accountId: ar.id, debit: total, credit: 0 }, ...creditLines],
    });
    journals.push(journal);
    journalId = journal.id;
  }
  return {
    ...data,
    invoices: [...data.invoices, {
      id,
      number,
      customerId: customer.id,
      date: input.date,
      dueDate: input.dueDate,
      lines,
      taxRate,
      status,
      notes: input.notes,
      payments: [],
      journalId,
      createdAt: Date.now()
    }],
    journals,
    nextNumbers: {
      ...data.nextNumbers,
      invoice: data.nextNumbers.invoice + 1
    }
  };
}
function nextReceiptNumber(data: FinanceData, date) {
  return `RCPT-${date.slice(0, 4)}-${String(data.nextNumbers.receipt).padStart(3, "0")}`;
}
export function recordInvoicePayment(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  const invoice = data.invoices.find((i) => i.id === input.invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void" || invoice.status === "paid") throw new Error("Invoice cannot accept payment");
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
  const method = input.method ?? "cash";
  const checkNumber = input.checkNumber?.trim() ?? "";
  if (methodNeedsReference(method) && !checkNumber) throw new Error(`Enter the ${methodLabel(method).toLowerCase()} reference.`);
  const due = invoiceBalance(data, invoice.id);
  const amount = Math.min(input.amount, due);
  if (amount <= 0) throw new Error("Nothing left to collect");
  const ar = data.accounts.find((a) => a.code === "1200");
  if (!ar) throw new Error("AR account missing");
  const customer = data.customers.find((c) => c.id === invoice.customerId);
  const paymentId = newId();
  const receiptId = newId();
  const checkBit = method === "check" ? `Check ${checkNumber} ` : method === "card" ? `Card ${checkNumber} ` : method === "echeck" ? `e-Check ${checkNumber} ` : "";
  const journal = makeJournal({
    date: input.date,
    description: `${checkBit}Payment ${invoice.number} — ${customer?.name ?? ""}`.trim(),
    sourceType: "payment",
    sourceId: paymentId,
    lines: [{
      accountId: bank.accountId,
      debit: amount,
      credit: 0
    }, {
      accountId: ar.id,
      debit: 0,
      credit: amount
    }]
  });
  const payments = [...invoice.payments, {
    id: paymentId,
    date: input.date,
    amount,
    bankId: bank.id,
    journalId: journal.id
  }];
  const status = payments.reduce((s, p) => s + p.amount, 0) >= invoiceTotal({
    ...data,
    invoices: data.invoices.map((i) => i.id === invoice.id ? {
      ...invoice,
      payments
    } : i)
  }, invoice.id) ? "paid" : "partial";
  const receipt = {
    id: receiptId,
    number: nextReceiptNumber(data, input.date),
    date: input.date,
    kind: "payment",
    method,
    checkNumber,
    customerId: invoice.customerId,
    receivedFrom: customer?.name ?? invoice.number,
    bankId: bank.id,
    lines: [],
    invoiceId: invoice.id,
    paymentId,
    amount,
    taxRate: 0,
    status: "posted",
    memo: input.memo || `Payment ${invoice.number}`,
    journalId: journal.id,
    sortOrder: data.receipts.length,
    recon: "pending",
    createdAt: journal.createdAt
  };
  return {
    ...data,
    invoices: data.invoices.map((i) => i.id === invoice.id ? {
      ...invoice,
      payments,
      status
    } : i),
    receipts: [...data.receipts, receipt],
    journals: [...data.journals, journal],
    nextNumbers: {
      ...data.nextNumbers,
      receipt: data.nextNumbers.receipt + 1
    }
  };
}
export function applyCustomerPayments(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  let next = data;
  for (const app of input.applications) {
    if (app.amount <= 0) continue;
    next = recordInvoicePayment(next, {
      invoiceId: app.invoiceId,
      date: input.date,
      amount: app.amount,
      bankId: input.bankId,
      memo: input.memo,
      method: input.method,
      checkNumber: input.checkNumber
    });
  }
  return next;
}
export function voidInvoice(data: FinanceData, id, date = todayIso()): FinanceData {
  const invoice = data.invoices.find((i) => i.id === id);
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void") return data;
  const journals = [...data.journals];
  if (invoice.journalId) {
    const original = data.journals.find((j) => j.id === invoice.journalId);
    if (original) journals.push(reverseJournal(original, date, `Void ${invoice.number}`));
  }
  for (const payment of invoice.payments) {
    const original = data.journals.find((j) => j.id === payment.journalId);
    if (original) journals.push(reverseJournal(original, date, `Void payment ${invoice.number}`));
  }
  return {
    ...data,
    invoices: data.invoices.map((i) => i.id === id ? {
      ...i,
      status: "void"
    } : i),
    receipts: data.receipts.map((r) => r.invoiceId === id && r.status === "posted" ? {
      ...r,
      status: "void"
    } : r),
    journals
  };
}
export function removeInvoice(data: FinanceData, id): FinanceData {
  const invoice = data.invoices.find((i) => i.id === id);
  if (!invoice) throw new Error("Invoice not found");
  const related = data.receipts.filter((r) => r.invoiceId === id);
  const ids = [
    invoice.journalId,
    ...invoice.payments.map((p) => p.journalId),
    ...related.flatMap((r) => [r.journalId, r.reversalJournalId])
  ];
  return dropJournalsAndReversals({
    ...data,
    invoices: data.invoices.filter((i) => i.id !== id),
    receipts: data.receipts.filter((r) => r.invoiceId !== id)
  }, ids);
}
export function createCashSale(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
  const customer = data.customers.find((c) => c.id === input.customerId);
  if (!customer) throw new Error("Pick a customer on file, or add them first.");
  const method = input.method ?? "cash";
  const checkNumber = input.checkNumber?.trim() ?? "";
  if (methodNeedsReference(method) && !checkNumber) throw new Error(`Enter the ${methodLabel(method).toLowerCase()} reference.`);
  const lines = input.lines.filter((l) => l.description.trim() && l.quantity > 0).map((l) => ({
    ...l,
    id: newId(),
    unitPrice: Math.round(l.unitPrice)
  }));
  if (lines.length === 0) throw new Error("Add at least one line");
  const taxRate = input.taxRate ?? (data.settings.taxEnabled ? data.settings.defaultTaxRate : 0);
  const amount = receiptTotal(lines, taxRate, taxRate > 0);
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  const sales = data.accounts.find((a) => a.code === "4000");
  if (!sales) throw new Error("Income account missing");
  const vat = data.accounts.find((a) => a.code === "2200");
  const subSale = invoiceSubtotal(lines);
  const taxSale = amount - subSale;
  const id = newId();
  const number = nextReceiptNumber(data, input.date);
  const receivedFrom = customer.name;
  const checkBit = method === "check" ? `Check ${checkNumber} ` : method === "card" ? `Card ${checkNumber} ` : method === "echeck" ? `e-Check ${checkNumber} ` : "";
  const journal = makeJournal({
    date: input.date,
    description: `${checkBit}Receipt ${number} — ${receivedFrom}`.trim(),
    sourceType: "receipt",
    sourceId: id,
    lines: [
      { accountId: bank.accountId, debit: amount, credit: 0 },
      ...(taxSale > 0 && vat
        ? [
            { accountId: sales.id, debit: 0, credit: subSale },
            { accountId: vat.id, debit: 0, credit: taxSale },
          ]
        : [{ accountId: sales.id, debit: 0, credit: amount }]),
    ]
  });
  const receipt = {
    id,
    number,
    date: input.date,
    kind: "cash-sale",
    method,
    checkNumber,
    customerId: input.customerId,
    receivedFrom,
    bankId: bank.id,
    lines,
    amount,
    taxRate,
    status: "posted",
    memo: input.notes,
    journalId: journal.id,
    sortOrder: data.receipts.length,
    recon: "pending",
    createdAt: journal.createdAt
  };
  return {
    ...data,
    receipts: [...data.receipts, receipt],
    journals: [...data.journals, journal],
    nextNumbers: {
      ...data.nextNumbers,
      receipt: data.nextNumbers.receipt + 1
    }
  };
}
export function voidReceipt(data: FinanceData, id, date = todayIso()): FinanceData {
  const receipt = data.receipts.find((r) => r.id === id);
  if (!receipt) throw new Error("Receipt not found");
  if (receipt.status === "void") return data;
  const original = data.journals.find((j) => j.id === receipt.journalId);
  if (!original) throw new Error("Original journal missing");
  const reversal = reverseJournal(original, date, `Void ${receipt.number}`);
  let invoices = data.invoices;
  if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) invoices = data.invoices.map((invoice) => {
    if (invoice.id !== receipt.invoiceId) return invoice;
    const payments = invoice.payments.filter((p) => p.id !== receipt.paymentId);
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const total = invoiceTotal({
      ...data,
      invoices: data.invoices.map((i) => i.id === invoice.id ? {
        ...invoice,
        payments
      } : i)
    }, invoice.id);
    const status = paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
    return {
      ...invoice,
      payments,
      status: invoice.status === "void" ? invoice.status : status
    };
  });
  return {
    ...data,
    invoices,
    receipts: data.receipts.map((r) => r.id === id ? {
      ...r,
      status: "void",
      reversalJournalId: reversal.id
    } : r),
    journals: [...data.journals, reversal]
  };
}
export function removeReceipt(data: FinanceData, id): FinanceData {
  const receipt = data.receipts.find((r) => r.id === id);
  if (!receipt) throw new Error("Receipt not found");
  let invoices = data.invoices;
  if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) invoices = invoices.map((invoice) => {
    if (invoice.id !== receipt.invoiceId) return invoice;
    const payments = invoice.payments.filter((p) => p.id !== receipt.paymentId);
    if (invoice.status === "void") return {
      ...invoice,
      payments
    };
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const total = invoiceTotal({
      ...data,
      invoices: data.invoices.map((i) => i.id === invoice.id ? {
        ...invoice,
        payments
      } : i)
    }, invoice.id);
    const status = paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
    return {
      ...invoice,
      payments,
      status
    };
  });
  return dropJournalsAndReversals({
    ...data,
    invoices,
    receipts: data.receipts.filter((r) => r.id !== id)
  }, [receipt.journalId, receipt.reversalJournalId]);
}
export function reorderReceipts(data: FinanceData, ids): FinanceData {
  return {
    ...data,
    receipts: applyOrder(data.receipts, ids)
  };
}
export function createBill(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  const vendor = data.vendors.find((v) => v.id === input.vendorId);
  if (!vendor) throw new Error("Vendor not found");
  if (input.amount <= 0) throw new Error("Amount must be greater than zero");
  const expense = data.accounts.find((a) => a.id === input.accountId);
  const ap = data.accounts.find((a) => a.code === "2000");
  if (!expense || !ap) throw new Error("Expense or AP account missing");
  const id = newId();
  const number = `BILL-${input.date.slice(0, 4)}-${String(data.nextNumbers.bill).padStart(3, "0")}`;
  const journal = makeJournal({
    date: input.date,
    description: `Bill ${number} — ${vendor.name}`,
    sourceType: "bill",
    sourceId: id,
    lines: [{
      accountId: expense.id,
      debit: input.amount,
      credit: 0,
      memo: input.memo
    }, {
      accountId: ap.id,
      debit: 0,
      credit: input.amount
    }]
  });
  const bill = {
    id,
    number,
    vendorId: vendor.id,
    date: input.date,
    dueDate: input.dueDate,
    amount: input.amount,
    accountId: expense.id,
    status: "open",
    memo: input.memo,
    reference: input.reference,
    payments: [],
    journalId: journal.id,
    sortOrder: data.bills.length,
    createdAt: journal.createdAt
  };
  return {
    ...data,
    bills: [...data.bills, bill],
    journals: [...data.journals, journal],
    nextNumbers: {
      ...data.nextNumbers,
      bill: data.nextNumbers.bill + 1
    }
  };
}
export function payBill(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  const bill = data.bills.find((b) => b.id === input.billId);
  if (!bill) throw new Error("Bill not found");
  if (bill.status === "void" || bill.status === "paid") throw new Error("Bill cannot accept payment");
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
  const due = billBalance(bill);
  const amount = Math.min(input.amount, due);
  if (amount <= 0) throw new Error("Nothing left to pay");
  const ap = data.accounts.find((a) => a.code === "2000");
  if (!ap) throw new Error("AP account missing");
  const vendor = data.vendors.find((v) => v.id === bill.vendorId);
  const paymentId = newId();
  const journal = makeJournal({
    date: input.date,
    description: `Payment ${bill.number} — ${vendor?.name ?? ""}`,
    sourceType: "bill-payment",
    sourceId: paymentId,
    lines: [{
      accountId: ap.id,
      debit: amount,
      credit: 0
    }, {
      accountId: bank.accountId,
      debit: 0,
      credit: amount
    }]
  });
  const payments = [...bill.payments, {
    id: paymentId,
    date: input.date,
    amount,
    bankId: bank.id,
    journalId: journal.id,
    recon: "pending"
  }];
  const status = payments.reduce((s, p) => s + p.amount, 0) >= bill.amount ? "paid" : "partial";
  return {
    ...data,
    bills: data.bills.map((b) => b.id === bill.id ? {
      ...bill,
      payments,
      status
    } : b),
    journals: [...data.journals, journal]
  };
}
export function voidBill(data: FinanceData, id, date = todayIso()): FinanceData {
  const bill = data.bills.find((b) => b.id === id);
  if (!bill) throw new Error("Bill not found");
  if (bill.status === "void") return data;
  const journals = [...data.journals];
  if (bill.journalId) {
    const original = data.journals.find((j) => j.id === bill.journalId);
    if (original) journals.push(reverseJournal(original, date, `Void ${bill.number}`));
  }
  for (const payment of bill.payments) {
    const original = data.journals.find((j) => j.id === payment.journalId);
    if (original) journals.push(reverseJournal(original, date, `Void payment ${bill.number}`));
  }
  return {
    ...data,
    bills: data.bills.map((b) => b.id === id ? {
      ...b,
      status: "void"
    } : b),
    journals
  };
}
export function removeBill(data: FinanceData, id): FinanceData {
  const bill = data.bills.find((b) => b.id === id);
  if (!bill) throw new Error("Bill not found");
  const ids = [bill.journalId, ...bill.payments.map((p) => p.journalId)];
  return dropJournalsAndReversals({
    ...data,
    bills: data.bills.filter((b) => b.id !== id)
  }, ids);
}
export function removeBillPayment(data: FinanceData, paymentId): FinanceData {
  const bill = data.bills.find((b) => b.payments.some((p) => p.id === paymentId));
  if (!bill) throw new Error("Vendor payment not found");
  const pay = bill.payments.find((p) => p.id === paymentId);
  if (!pay) throw new Error("Vendor payment not found");
  const payments = bill.payments.filter((p) => p.id !== paymentId);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const status = paid <= 0 ? "open" : paid >= bill.amount ? "paid" : "partial";
  return dropJournalsAndReversals({
    ...data,
    bills: data.bills.map((b) => b.id === bill.id ? {
      ...bill,
      payments,
      status
    } : b)
  }, [pay.journalId]);
}
export function removeCashLine(data: FinanceData, line): FinanceData {
  if (!line.sourceId || line.kind === "opening") throw new Error("This line cannot be deleted.");
  assertUnlocked(data, line.kind, line.sourceId);
  if (line.kind === "check") return removeCheck(data, line.sourceId);
  if (line.kind === "receipt" || line.kind === "payment") return removeReceipt(data, line.sourceId);
  if (line.kind === "bill-payment") return removeBillPayment(data, line.sourceId);
  if (line.kind === "deposit" || line.kind === "expense" || line.kind === "transfer") return dropJournalsAndReversals(data, [line.sourceId]);
  throw new Error("This line cannot be deleted.");
}
export function removeCashLines(data: FinanceData, lines): {
  data: FinanceData;
  deleted: number;
  failed: number;
} {
  // Deduplicate transfer (and any) dual-sides by kind:sourceId.
  const unique = [];
  const seen = new Set();
  let dupes = 0;
  for (const line of lines) {
    const key = `${line.kind}:${line.sourceId}`;
    if (seen.has(key)) {
      dupes += 1;
      continue;
    }
    seen.add(key);
    unique.push(line);
  }
  if (unique.length === 0) throw new Error("Could not delete those entries.");

  // One snapshot only: preflight and chain both use `data` / derived `next`.
  // Caller (store set updater) must pass the current books — never a stale UI copy.
  // Any failure aborts with zero deletes — all-or-nothing; no partial writes.
  let failCount = 0;
  let firstError = null;
  for (const line of unique) {
    try {
      removeCashLine(data, line);
    } catch (err) {
      failCount += 1;
      if (!firstError) firstError = err;
    }
  }
  if (failCount > 0) {
    const detail = firstError instanceof Error ? firstError.message : "Could not delete those entries.";
    if (failCount === unique.length) throw new Error(detail);
    throw new Error(`Nothing deleted — ${failCount} of ${unique.length} could not be removed (${detail})`);
  }

  let next = data;
  for (const line of unique) {
    next = removeCashLine(next, line);
  }
  return { data: next, deleted: unique.length + dupes, failed: 0 };
}
export function reorderBills(data: FinanceData, ids): FinanceData {
  return {
    ...data,
    bills: applyOrder(data.bills, ids)
  };
}
export function addDeposit(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
  const income = input.accountId ? data.accounts.find((a) => a.id === input.accountId) : data.accounts.find((a) => a.code === "4000");
  if (!income) throw new Error("Income account missing");
  const journal = makeJournal({
    date: input.date,
    description: input.memo || `Deposit — ${bank.nickname}`,
    sourceType: "deposit",
    sourceId: bank.id,
    lines: [{
      accountId: bank.accountId,
      debit: input.amount,
      credit: 0
    }, {
      accountId: income.id,
      debit: 0,
      credit: input.amount
    }]
  });
  return {
    ...data,
    journals: [...data.journals, journal]
  };
}
export function addExpense(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
  const journal = makeJournal({
    date: input.date,
    description: input.memo || `Expense — ${bank.nickname}`,
    sourceType: "expense",
    sourceId: bank.id,
    lines: [{
      accountId: input.accountId,
      debit: input.amount,
      credit: 0
    }, {
      accountId: bank.accountId,
      debit: 0,
      credit: input.amount
    }]
  });
  return {
    ...data,
    journals: [...data.journals, journal]
  };
}
export function transferBanks(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  if (input.fromId === input.toId) throw new Error("Pick two different banks");
  const from = data.banks.find((b) => b.id === input.fromId);
  const to = data.banks.find((b) => b.id === input.toId);
  if (!from || !to) throw new Error("Bank not found");
  const journal = makeJournal({
    date: input.date,
    description: input.memo || `Transfer ${from.nickname} → ${to.nickname}`,
    sourceType: "transfer",
    lines: [{
      accountId: to.accountId,
      debit: input.amount,
      credit: 0
    }, {
      accountId: from.accountId,
      debit: 0,
      credit: input.amount
    }]
  });
  return {
    ...data,
    journals: [...data.journals, journal]
  };
}
export function upsertBudget(data: FinanceData, item): FinanceData {
  if (item.id) return {
    ...data,
    budgetItems: data.budgetItems.map((b) => b.id === item.id ? {
      ...b,
      ...item,
      id: item.id
    } : b)
  };
  return {
    ...data,
    budgetItems: [...data.budgetItems, {
      ...item,
      id: newId()
    }]
  };
}
export function removeBudget(data: FinanceData, id): FinanceData {
  return {
    ...data,
    budgetItems: data.budgetItems.filter((b) => b.id !== id)
  };
}
export function rescheduleCashLine(data: FinanceData, input): FinanceData {
  assertOpenPeriod(data, input.date);
  assertUnlocked(data, input.kind, input.sourceId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Pick a valid date.");
  if (input.kind === "check") return rescheduleCheck(data, input.sourceId, input.date);
  if (input.kind === "receipt") return rescheduleReceipt(data, input.sourceId, input.date);
  if (input.kind === "journal" || input.kind === "transfer" || input.kind === "deposit" || input.kind === "expense") {
    return setJournalDate(data, input.sourceId, input.date);
  }
  return rescheduleBillPayment(data, input.sourceId, input.date);
}
function setJournalDate(data: FinanceData, journalId, date) {
  return {
    ...data,
    journals: data.journals.map((j) => j.id === journalId ? {
      ...j,
      date
    } : j)
  };
}
function rescheduleCheck(data: FinanceData, id, date) {
  const check = data.checks.find((c) => c.id === id);
  if (!check) throw new Error("Check not found");
  if (check.status === "voided" || check.status === "bounced") throw new Error("Voided checks stay on their original date.");
  if (check.issueDate === date) return data;
  const postDate = check.postDate < date ? date : check.postDate;
  const next = setJournalDate(data, check.journalId, date);
  return {
    ...next,
    checks: next.checks.map((c) => c.id === id ? {
      ...c,
      issueDate: date,
      postDate
    } : c)
  };
}
function rescheduleReceipt(data: FinanceData, id, date) {
  const receipt = data.receipts.find((r) => r.id === id);
  if (!receipt) throw new Error("Receipt not found");
  if (receipt.status === "void") throw new Error("Voided receipts stay on their original date.");
  if (receipt.date === date) return data;
  let next = setJournalDate(data, receipt.journalId, date);
  if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) next = {
    ...next,
    invoices: next.invoices.map((invoice) => {
      if (invoice.id !== receipt.invoiceId) return invoice;
      return {
        ...invoice,
        payments: invoice.payments.map((p) => p.id === receipt.paymentId ? {
          ...p,
          date
        } : p)
      };
    })
  };
  return {
    ...next,
    receipts: next.receipts.map((r) => r.id === id ? {
      ...r,
      date
    } : r)
  };
}
function rescheduleBillPayment(data: FinanceData, paymentId, date) {
  const bill = data.bills.find((b) => b.payments.some((p) => p.id === paymentId));
  if (!bill) throw new Error("Payment not found");
  const payment = bill.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error("Payment not found");
  if (payment.date === date) return data;
  const next = setJournalDate(data, payment.journalId, date);
  return {
    ...next,
    bills: next.bills.map((b) => b.id === bill.id ? {
      ...b,
      payments: b.payments.map((p) => p.id === paymentId ? {
        ...p,
        date
      } : p)
    } : b)
  };
}
function dropJournalsAndReversals(data: FinanceData, ids) {
  const drop = new Set(ids.filter((id) => Boolean(id)));
  if (drop.size === 0) return data;
  for (const journal of data.journals) if (journal.sourceType === "reversal" && journal.sourceId && drop.has(journal.sourceId)) drop.add(journal.id);
  return {
    ...data,
    journals: data.journals.filter((j) => !drop.has(j.id))
  };
}
function patchJournalAmount(data: FinanceData, journalId, input) {
  return {
    ...data,
    journals: data.journals.map((journal) => {
      if (journal.id !== journalId) return journal;
      const amount = input.amount;
      const lines = journal.lines.map((line) => {
        const isDebit = line.debit > 0 && line.credit === 0;
        const nextAmount = typeof amount === "number" ? amount : isDebit ? line.debit : line.credit;
        if (isDebit) return {
          ...line,
          accountId: input.debitAccountId ?? line.accountId,
          debit: nextAmount,
          credit: 0,
          memo: input.memo ?? line.memo
        };
        return {
          ...line,
          accountId: input.creditAccountId ?? line.accountId,
          debit: 0,
          credit: nextAmount,
          memo: input.memo ?? line.memo
        };
      });
      return {
        ...journal,
        date: input.date ?? journal.date,
        description: input.description ?? journal.description,
        lines
      };
    })
  };
}
export function updateCheck(data: FinanceData, id, patch): FinanceData {
  const check = data.checks.find((c) => c.id === id);
  if (!check) throw new Error("Check not found");
  if (check.status === "voided" || check.status === "bounced") throw new Error("Voided checks cannot be edited. Delete them to re-enter.");
  const payee = (patch.payee ?? check.payee).trim();
  const amount = patch.amount ?? check.amount;
  const issueDate = patch.issueDate ?? check.issueDate;
  const postDate = patch.postDate ?? check.postDate;
  const memo = patch.memo ?? check.memo;
  const checkNumber = (patch.checkNumber ?? check.checkNumber).trim() || check.checkNumber;
  const accountId = patch.accountId ?? check.accountId;
  const bankId = patch.bankId ?? check.bankId;
  if (!payee) throw new Error("Payee is required.");
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  const bank = data.banks.find((b) => b.id === bankId);
  if (!bank) throw new Error("Bank not found");
  const next = patchJournalAmount(data, check.journalId, {
    date: issueDate,
    description: `Check ${checkNumber} — ${payee}`,
    amount,
    memo,
    debitAccountId: accountId,
    creditAccountId: bank.accountId
  });
  return {
    ...next,
    checks: next.checks.map((c) => c.id === id ? {
      ...c,
      payee,
      amount,
      issueDate,
      postDate,
      memo,
      checkNumber,
      accountId,
      bankId
    } : c)
  };
}
export function updateReceipt(data: FinanceData, id, patch): FinanceData {
  const receipt = data.receipts.find((r) => r.id === id);
  if (!receipt) throw new Error("Receipt not found");
  if (receipt.status === "void") throw new Error("Voided receipts cannot be edited. Delete them to re-enter.");
  const date = patch.date ?? receipt.date;
  const receivedFrom = (patch.receivedFrom ?? receipt.receivedFrom).trim();
  const amount = patch.amount ?? receipt.amount;
  const memo = patch.memo ?? receipt.memo;
  const method = patch.method ?? receipt.method;
  const checkNumber = (patch.checkNumber ?? receipt.checkNumber).trim();
  const bankId = patch.bankId ?? receipt.bankId;
  if (!receivedFrom) throw new Error("Received from is required.");
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  if (methodNeedsReference(method) && !checkNumber) throw new Error(`Enter the ${methodLabel(method).toLowerCase()} reference.`);
  const bank = data.banks.find((b) => b.id === bankId);
  if (!bank) throw new Error("Bank not found");
  let next = data;
  if (receipt.kind === "payment" && receipt.invoiceId && receipt.paymentId) {
    const invoice = data.invoices.find((i) => i.id === receipt.invoiceId);
    if (invoice) {
      const payments = invoice.payments.map((p) => p.id === receipt.paymentId ? {
        ...p,
        date,
        amount,
        bankId
      } : p);
      const paid = payments.reduce((s, p) => s + p.amount, 0);
      const total = invoiceTotal(data, invoice.id);
      if (paid > total) throw new Error("Payment exceeds the invoice total.");
      const status = paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
      next = {
        ...next,
        invoices: next.invoices.map((i) => i.id === invoice.id ? {
          ...invoice,
          payments,
          status: invoice.status === "void" ? invoice.status : status
        } : i)
      };
    }
  }
  const checkBit = method === "check" ? `Check ${checkNumber} ` : method === "card" ? `Card ${checkNumber} ` : method === "echeck" ? `e-Check ${checkNumber} ` : "";
  const description = `${checkBit}Receipt ${receipt.number} — ${receivedFrom}`.trim();
  // Taxed cash sales are 3-line (bank / sales / output VAT). patchJournalAmount would
  // set every credit line to the full amount and unbalance the journal — same class as
  // the old invoice-edit bug. Rebuild like createCashSale / updateInvoiceRecord.
  const journal = next.journals.find((j) => j.id === receipt.journalId);
  const taxRate = receipt.taxRate ?? 0;
  const needsVatRebuild =
    receipt.kind === "cash-sale" && (taxRate > 0 || (journal?.lines.length ?? 0) > 2);
  if (needsVatRebuild) {
    const sales = next.accounts.find((a) => a.code === "4000");
    const vat = next.accounts.find((a) => a.code === "2200");
    if (!sales) throw new Error("Income account missing");
    // amount is bank total (gross). Split so sales + VAT credits equal amount exactly.
    const sub = taxRate > 0 ? Math.round((amount * 100) / (100 + taxRate)) : amount;
    const tax = amount - sub;
    const creditLines = tax > 0 && vat
      ? [
          { id: newId(), accountId: sales.id, debit: 0, credit: sub, memo: memo || "" },
          { id: newId(), accountId: vat.id, debit: 0, credit: tax, memo: "" },
        ]
      : [{ id: newId(), accountId: sales.id, debit: 0, credit: amount, memo: memo || "" }];
    const rebuilt = [
      { id: newId(), accountId: bank.accountId, debit: amount, credit: 0, memo: memo || "" },
      ...creditLines,
    ];
    const deb = rebuilt.reduce((s, l) => s + l.debit, 0);
    const cred = rebuilt.reduce((s, l) => s + l.credit, 0);
    if (deb !== cred) throw new Error(`Unbalanced receipt journal: debit ${deb} credit ${cred}`);
    next = {
      ...next,
      journals: next.journals.map((j) => {
        if (j.id !== receipt.journalId) return j;
        return { ...j, date, description, lines: rebuilt };
      }),
    };
  } else {
    next = patchJournalAmount(next, receipt.journalId, {
      date,
      description,
      amount,
      memo,
      debitAccountId: bank.accountId
    });
  }
  return {
    ...next,
    receipts: next.receipts.map((r) => r.id === id ? {
      ...r,
      date,
      receivedFrom,
      amount,
      memo,
      method,
      checkNumber,
      bankId
    } : r)
  };
}
export function updateBillRecord(data: FinanceData, id, patch): FinanceData {
  const bill = data.bills.find((b) => b.id === id);
  if (!bill) throw new Error("Bill not found");
  if (bill.status === "void") throw new Error("Voided bills cannot be edited.");
  const date = patch.date ?? bill.date;
  const dueDate = patch.dueDate ?? bill.dueDate;
  const amount = patch.amount ?? bill.amount;
  const memo = patch.memo ?? bill.memo;
  const paid = bill.payments.reduce((s, p) => s + p.amount, 0);
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  if (amount < paid) throw new Error("Amount cannot be less than already paid.");
  const status = paid <= 0 ? "open" : paid >= amount ? "paid" : "partial";
  let next = data;
  if (bill.journalId) next = patchJournalAmount(next, bill.journalId, {
    date,
    description: `Bill ${bill.number}${memo ? ` — ${memo}` : ""}`,
    amount,
    memo
  });
  return {
    ...next,
    bills: next.bills.map((b) => b.id === id ? {
      ...b,
      date,
      dueDate,
      amount,
      memo,
      status
    } : b)
  };
}
export function updateJournalEntry(data: FinanceData, id, patch): FinanceData {
  const journal = data.journals.find((j) => j.id === id);
  if (!journal) throw new Error("Entry not found");
  if (journal.sourceType !== "deposit" && journal.sourceType !== "expense" && journal.sourceType !== "transfer") throw new Error("Open the source document to edit this line.");
  const amount = patch.amount ?? journal.lines.reduce((s, l) => s + l.debit, 0);
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  return patchJournalAmount(data, id, {
    date: patch.date,
    description: patch.description,
    amount
  });
}
export function updateInvoiceRecord(data: FinanceData, id, patch): FinanceData {
  const invoice = data.invoices.find((i) => i.id === id);
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status === "void") throw new Error("Voided invoices cannot be edited.");
  const date = patch.date ?? invoice.date;
  const dueDate = patch.dueDate ?? invoice.dueDate;
  const notes = patch.notes ?? invoice.notes;
  let lines = invoice.lines;
  if (patch.lines) {
    lines = patch.lines.filter((l) => l.description?.trim() && l.quantity > 0).map((l, i) => ({
      id: l.id || invoice.lines[i]?.id || newId(),
      description: String(l.description).trim(),
      quantity: l.quantity,
      unitPrice: Math.round(l.unitPrice)
    }));
    if (lines.length === 0) throw new Error("Add at least one line");
  }
  const taxRate = patch.taxRate ?? invoice.taxRate;
  const sub = invoiceSubtotal(lines);
  // Keep tax when the invoice carries a rate (historical); Settings only seeds new invoices.
  const total = sub + invoiceTax(sub, taxRate, taxRate > 0);
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  if (total < paid) throw new Error("Total cannot be less than already paid.");
  const status = invoice.status === "draft" ? "draft" : paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
  const customer = data.customers.find((c) => c.id === invoice.customerId);
  let next = data;
  if (invoice.journalId) {
    const ar = next.accounts.find((a) => a.code === "1200");
    const sales = next.accounts.find((a) => a.code === "4000");
    const vat = next.accounts.find((a) => a.code === "2200");
    if (!ar || !sales) throw new Error("AR or income account missing");
    const tax = total - sub;
    const creditLines = tax > 0 && vat
      ? [
          { id: newId(), accountId: sales.id, debit: 0, credit: sub, memo: "" },
          { id: newId(), accountId: vat.id, debit: 0, credit: tax, memo: "" },
        ]
      : [{ id: newId(), accountId: sales.id, debit: 0, credit: total, memo: "" }];
    const description = `Invoice ${invoice.number} — ${customer?.name ?? ""}`.trim();
    const rebuilt = [
      { id: newId(), accountId: ar.id, debit: total, credit: 0, memo: "" },
      ...creditLines,
    ];
    const deb = rebuilt.reduce((s, l) => s + l.debit, 0);
    const cred = rebuilt.reduce((s, l) => s + l.credit, 0);
    if (deb !== cred) throw new Error(`Unbalanced invoice journal: debit ${deb} credit ${cred}`);
    next = {
      ...next,
      journals: next.journals.map((journal) => {
        if (journal.id !== invoice.journalId) return journal;
        return {
          ...journal,
          date,
          description,
          lines: rebuilt,
        };
      }),
    };
  }
  return {
    ...next,
    invoices: next.invoices.map((i) => i.id === id ? {
      ...i,
      date,
      dueDate,
      notes,
      lines,
      taxRate,
      status
    } : i)
  };
}
export function updateSettings(data: FinanceData, patch): FinanceData {
  return {
    ...data,
    settings: {
      ...data.settings,
      ...patch
    }
  };
}
export function reassignCashBank(data: FinanceData, input): FinanceData {
  if (input.kind === "opening") throw new Error("Opening balance stays on its banks.");
  assertUnlocked(data, input.kind, input.sourceId);
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank || bank.archived) throw new Error("Bank not found");
  if (input.kind === "check") return updateCheck(data, input.sourceId, { bankId: input.bankId });
  if (input.kind === "receipt" || input.kind === "payment") return updateReceipt(data, input.sourceId, { bankId: input.bankId });
  if (input.kind === "bill-payment") return reassignBillPayment(data, input.sourceId, input.bankId);
  if (input.kind === "deposit" || input.kind === "expense" || input.kind === "transfer") return reassignJournalBank(data, input.sourceId, input.bankId, input.fromBankId);
  throw new Error("This line cannot move banks.");
}
export function reassignCashBanks(data: FinanceData, lines, bankId): FinanceData {
  return lines.reduce((acc, line) => reassignCashBank(acc, {
    ...line,
    bankId
  }), data);
}
function reassignBillPayment(data: FinanceData, paymentId, bankId) {
  const bank = data.banks.find((b) => b.id === bankId);
  if (!bank) throw new Error("Bank not found");
  const bill = data.bills.find((b) => b.payments.some((p) => p.id === paymentId));
  if (!bill) throw new Error("Vendor payment not found");
  const payment = bill.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error("Vendor payment not found");
  if (payment.bankId === bankId) return data;
  const next = patchJournalAmount(data, payment.journalId, { creditAccountId: bank.accountId });
  return {
    ...next,
    bills: next.bills.map((b) => b.id === bill.id ? {
      ...b,
      payments: b.payments.map((p) => p.id === paymentId ? {
        ...p,
        bankId
      } : p)
    } : b)
  };
}
function reassignJournalBank(data: FinanceData, journalId, toBankId, fromBankId) {
  const journal = data.journals.find((j) => j.id === journalId);
  if (!journal) throw new Error("Entry not found");
  const toBank = data.banks.find((b) => b.id === toBankId);
  if (!toBank) throw new Error("Bank not found");
  const fromBank = fromBankId ? data.banks.find((b) => b.id === fromBankId) : data.banks.find((b) => journal.lines.some((l) => l.accountId === b.accountId));
  if (!fromBank) throw new Error("Source bank not found");
  if (fromBank.id === toBank.id) return data;
  if (!journal.lines.find((l) => l.accountId === fromBank.accountId)) throw new Error("This line is not on that bank.");
  if (journal.lines.some((l) => l.accountId === toBank.accountId)) throw new Error("That bank is already on this transfer. Pick a different account.");
  const description = journal.sourceType === "transfer" ? journal.description.replace(fromBank.nickname, toBank.nickname) : journal.description;
  return {
    ...data,
    journals: data.journals.map((j) => {
      if (j.id !== journalId) return j;
      return {
        ...j,
        description,
        lines: j.lines.map((l) => l.accountId === fromBank.accountId ? {
          ...l,
          accountId: toBank.accountId
        } : l)
      };
    })
  };
}

function cashReconOf(data: FinanceData, kind, sourceId): "pending" | "cleared" | "reconciled" {
  if (kind === "check") return data.checks.find((c) => c.id === sourceId)?.recon ?? "pending";
  if (kind === "receipt" || kind === "payment") return data.receipts.find((r) => r.id === sourceId)?.recon ?? "pending";
  if (kind === "bill-payment") {
    for (const bill of data.bills) {
      const pay = bill.payments.find((p) => p.id === sourceId);
      if (pay) return pay.recon ?? "pending";
    }
  }
  if (kind === "deposit" || kind === "expense" || kind === "transfer" || kind === "journal") {
    return data.journals.find((j) => j.id === sourceId)?.recon ?? "pending";
  }
  return "pending";
}

function assertUnlocked(data: FinanceData, kind, sourceId) {
  if (cashReconOf(data, kind, sourceId) === "reconciled") {
    throw new Error("This line is reconciled. Unlock it first.");
  }
}

export function setCashRecon(data: FinanceData, input): FinanceData {
  if (input.recon === "reconciled") {
    throw new Error("Mark reconciled from Reconcile → Finish statement.");
  }
  const locked = lineOnFinishedRecon(data, input.kind, input.sourceId);
  if (locked) {
    throw new Error(`This line is on the ${locked.statementDate} statement. Undo that rec first.`);
  }
  const date = cashLineDate(data, input.kind, input.sourceId);
  if (date) assertOpenPeriod(data, date);
  return applyCashRecon(data, input);
}

function cashLineDate(data: FinanceData, kind, sourceId): string {
  if (kind === "check") return data.checks.find((c) => c.id === sourceId)?.issueDate ?? "";
  if (kind === "receipt" || kind === "payment") return data.receipts.find((r) => r.id === sourceId)?.date ?? "";
  if (kind === "bill-payment") {
    for (const bill of data.bills) {
      const pay = bill.payments.find((p) => p.id === sourceId);
      if (pay) return pay.date;
    }
  }
  if (kind === "deposit" || kind === "expense" || kind === "transfer" || kind === "journal") {
    return data.journals.find((j) => j.id === sourceId)?.date ?? "";
  }
  return "";
}

function applyCashRecon(data: FinanceData, input): FinanceData {
  const recon = input.recon === "cleared" || input.recon === "reconciled" ? input.recon : "pending";
  if (input.kind === "check") {
    const check = data.checks.find((c) => c.id === input.sourceId);
    if (!check) throw new Error("Check not found");
    if (check.status === "voided" || check.status === "bounced") throw new Error("Voided checks stay as they are.");
    const status = recon === "pending" ? "pending" : "cleared";
    return {
      ...data,
      checks: data.checks.map((c) => c.id === input.sourceId ? { ...c, recon, status } : c)
    };
  }
  if (input.kind === "receipt" || input.kind === "payment") {
    const receipt = data.receipts.find((r) => r.id === input.sourceId);
    if (!receipt) throw new Error("Receipt not found");
    if (receipt.status === "void") throw new Error("Voided receipts stay as they are.");
    return {
      ...data,
      receipts: data.receipts.map((r) => r.id === input.sourceId ? { ...r, recon } : r)
    };
  }
  if (input.kind === "bill-payment") {
    const bill = data.bills.find((b) => b.payments.some((p) => p.id === input.sourceId));
    if (!bill) throw new Error("Payment not found");
    return {
      ...data,
      bills: data.bills.map((b) => b.id === bill.id ? {
        ...b,
        payments: b.payments.map((p) => p.id === input.sourceId ? { ...p, recon } : p)
      } : b)
    };
  }
  if (input.kind === "deposit" || input.kind === "expense" || input.kind === "transfer" || input.kind === "journal") {
    const journal = data.journals.find((j) => j.id === input.sourceId);
    if (!journal) throw new Error("Entry not found");
    return {
      ...data,
      journals: data.journals.map((j) => j.id === input.sourceId ? { ...j, recon } : j)
    };
  }
  throw new Error("This line cannot be reconciled.");
}

/** Drop closed documents through a date and post one condensed journal so balances stay put. */
export function purgeClosedThrough(data: FinanceData, throughDate: string): { data: FinanceData; removed: number } {
  if (!throughDate) throw new Error("Pick a date.");
  const dropInvoices = new Set(
    data.invoices
      .filter((i) => (i.status === "paid" || i.status === "void") && i.date <= throughDate)
      .map((i) => i.id),
  );
  const dropReceipts = new Set(
    data.receipts
      .filter((r) => {
        if (r.invoiceId && dropInvoices.has(r.invoiceId)) return true;
        if (r.kind === "cash-sale" && r.date <= throughDate) return true;
        if (r.kind === "payment" && r.status === "void" && r.date <= throughDate) return true;
        return false;
      })
      .map((r) => r.id),
  );
  const dropBills = new Set(
    data.bills
      .filter((b) => (b.status === "paid" || b.status === "void") && b.date <= throughDate)
      .map((b) => b.id),
  );
  const dropChecks = new Set(
    data.checks
      .filter((c) => c.status !== "pending" && c.issueDate <= throughDate)
      .map((c) => c.id),
  );

  const journalIds: Array<string | undefined> = [];
  for (const invoice of data.invoices) {
    if (!dropInvoices.has(invoice.id)) continue;
    journalIds.push(invoice.journalId, ...invoice.payments.map((p) => p.journalId));
  }
  for (const receipt of data.receipts) {
    if (!dropReceipts.has(receipt.id)) continue;
    journalIds.push(receipt.journalId, receipt.reversalJournalId);
  }
  for (const bill of data.bills) {
    if (!dropBills.has(bill.id)) continue;
    journalIds.push(bill.journalId, ...bill.payments.map((p) => p.journalId));
  }
  for (const check of data.checks) {
    if (!dropChecks.has(check.id)) continue;
    journalIds.push(check.journalId, check.reversalJournalId);
  }

  const drop = new Set(journalIds.filter((id): id is string => Boolean(id)));
  for (const journal of data.journals) {
    if (journal.sourceType === "reversal" && journal.sourceId && drop.has(journal.sourceId)) {
      drop.add(journal.id);
    }
  }

  const nets = new Map<string, number>();
  for (const journal of data.journals) {
    if (!drop.has(journal.id)) continue;
    for (const line of journal.lines) {
      nets.set(line.accountId, (nets.get(line.accountId) ?? 0) + line.debit - line.credit);
    }
  }
  const condensedLines = [...nets.entries()]
    .filter(([, net]) => net !== 0)
    .map(([accountId, net]) =>
      net > 0 ? { accountId, debit: net, credit: 0 } : { accountId, debit: 0, credit: -net },
    );

  const removed = dropInvoices.size + dropReceipts.size + dropBills.size + dropChecks.size;
  if (removed === 0) throw new Error("Nothing closed on or before that date.");

  let next: FinanceData = {
    ...data,
    invoices: data.invoices.filter((i) => !dropInvoices.has(i.id)),
    receipts: data.receipts.filter((r) => !dropReceipts.has(r.id)),
    bills: data.bills.filter((b) => !dropBills.has(b.id)),
    checks: data.checks.filter((c) => !dropChecks.has(c.id)),
    journals: data.journals.filter((j) => !drop.has(j.id)),
  };
  if (condensedLines.length > 0) {
    next = {
      ...next,
      journals: [
        makeJournal({
          date: throughDate,
          description: `Condensed books through ${throughDate}`,
          sourceType: "manual",
          lines: condensedLines,
        }),
        ...next.journals,
      ],
    };
  }
  return { data: next, removed };
}

const AUDIT_WHO = "this browser";

function appendAudit(
  data: FinanceData,
  action: string,
  detail: string,
  extra?: { old?: string; new?: string },
): FinanceData {
  const event: AuditEvent = {
    id: newId(),
    at: Date.now(),
    who: AUDIT_WHO,
    action,
    detail,
    old: extra?.old ?? "",
    new: extra?.new ?? "",
  };
  const audit = [...(data.audit ?? []), event].slice(-2000);
  return { ...data, audit };
}

export function closeBooks(data: FinanceData, throughDate: string, packetPrinted = false): FinanceData {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(throughDate)) throw new Error("Pick a valid date.");
  const current = (data.settings.closedThrough ?? "").trim();
  if (current && throughDate < current) {
    throw new Error(`Already closed through ${current}. Reopen first if you must move the date back.`);
  }
  const check = closeChecklist(data, throughDate);
  if (!check.ok) throw new Error(check.blockers[0] || "Close checklist is not clear.");
  if (!packetPrinted) throw new Error("Print the period pack first. That is the proof, not a checkbox.");
  const totals = closeTotals(data, throughDate);
  const equity = data.accounts.find((a) => a.code === "3000") ?? data.accounts.find((a) => a.type === "equity");
  if (!equity) throw new Error("Equity account missing.");
  const journal = {
    ...makeJournal({
      date: throughDate,
      description: `Close through ${throughDate}`,
      sourceType: "close",
      lines:
        totals.banks.length === 0
          ? [{ accountId: equity.id, debit: 0, credit: 0, memo: "Close" }]
          : totals.banks.map((b) => ({
              accountId: equity.id,
              debit: 0,
              credit: 0,
              memo: `${b.nickname} ${(b.balance / 100).toFixed(2)}`,
            })),
    }),
  };
  const snap: CloseSnapshot = {
    through: throughDate,
    closedAt: Date.now(),
    journalId: journal.id,
    packetPrinted: true,
    banks: totals.banks,
    ar: totals.ar,
    ap: totals.ap,
    tbDebit: totals.tbDebit,
    tbCredit: totals.tbCredit,
  };
  const next = updateSettings(
    { ...data, journals: [...data.journals, journal] },
    { closedThrough: throughDate },
  );
  return appendAudit(
    { ...next, closeHistory: [...(next.closeHistory ?? []).filter((s) => s.through !== throughDate), snap] },
    "close",
    `Closed through ${throughDate}. Bank balances posted as the opening fact.`,
    { old: current, new: throughDate },
  );
}

export function reopenBooks(data: FinanceData, reason = ""): FinanceData {
  const current = (data.settings.closedThrough ?? "").trim();
  if (!current) throw new Error("Books are already open.");
  const note = reason.trim() || "Reopened from this browser.";
  const history = (data.closeHistory ?? []).map((s) =>
    s.through === current && !s.reopenedAt ? { ...s, reopenedAt: Date.now(), reopenReason: note } : s,
  );
  return appendAudit(updateSettings({ ...data, closeHistory: history }, { closedThrough: "" }), "reopen", note, {
    old: current,
    new: "",
  });
}

export function finishRecon(
  data: FinanceData,
  input: {
    bankId: string;
    statementDate: string;
    statementEnding: number;
    lines: Array<{ kind: CashLineKind; sourceId: string }>;
  },
): FinanceData {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.statementDate)) throw new Error("Pick a statement date.");
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
  const last = lastReconBefore(data, input.bankId, input.statementDate);
  const later = (data.reconHistory ?? []).find((r) => r.bankId === input.bankId && r.statementDate >= input.statementDate);
  if (later) throw new Error(`A statement is already finished on or after ${later.statementDate}. Undo it first.`);
  const uncleared = unclearedLines(data, input.bankId, input.statementDate);
  const ticked = input.lines.map((sel) => {
    const line = uncleared.find((l) => l.kind === sel.kind && l.sourceId === sel.sourceId);
    if (!line) throw new Error("A ticked line is not on this statement.");
    return line;
  });
  const beginning = reconBeginning(data, input.bankId, input.statementDate);
  const diff = reconDifference(beginning, input.statementEnding, ticked);
  if (diff !== 0) throw new Error("Cleared difference must be zero — post a fee or interest, or tick the missing lines.");
  const tickedKeys = new Set(ticked.map((l) => `${l.kind}:${l.sourceId}`));
  const explain = reconExplain(uncleared, tickedKeys, (l) => `${l.kind}:${l.sourceId}`);
  const book = bookBalanceOn(data, input.bankId, input.statementDate);
  const explained = explainedDifference(input.statementEnding, explain.inTransitTotal, explain.outstandingTotal, book);
  if (explained !== 0) throw new Error("Explained difference must be zero — outstanding and in-transit must prove the book.");
  let next = data;
  for (const line of ticked) {
    next = applyCashRecon(next, { kind: line.kind, sourceId: line.sourceId, recon: "reconciled" });
  }
  const leftover = [...explain.outstanding, ...explain.inTransit];
  const report: ReconStatement = {
    id: newId(),
    bankId: input.bankId,
    statementDate: input.statementDate,
    statementEnding: input.statementEnding,
    beginning,
    bookBalance: book,
    clearedIn: ticked.reduce((s, l) => s + l.deposit, 0),
    clearedOut: ticked.reduce((s, l) => s + l.payment, 0),
    outstanding: explain.outstandingTotal,
    depositsInTransit: explain.inTransitTotal,
    explained,
    finishedAt: Date.now(),
    lines: ticked.map((l) => ({ kind: l.kind, sourceId: l.sourceId })),
    outstandingLines: namedReconLines(explain.outstanding, input.statementDate, "payment"),
    ditLines: namedReconLines(explain.inTransit, input.statementDate, "deposit"),
    adjustmentLines: namedFromCash(ticked.filter(isReconAdj), input.statementDate),
    unclearedAging: unclearedAge(leftover, input.statementDate),
  };
  next = {
    ...next,
    banks: next.banks.map((b) =>
      b.id === input.bankId
        ? { ...b, lastStatementDate: input.statementDate, lastStatementEnding: input.statementEnding }
        : b,
    ),
    reconHistory: [...(next.reconHistory ?? []), report],
  };
  return appendAudit(next, "recon", `Finished ${bank.nickname} statement ${input.statementDate}.`, {
    old: last ? String(last.statementEnding) : String(beginning),
    new: String(input.statementEnding),
  });
}

export function undoLastRecon(data: FinanceData, bankId: string): FinanceData {
  const history = (data.reconHistory ?? []).filter((r) => r.bankId === bankId);
  const last = history.at(-1);
  if (!last) throw new Error("No finished statement on this bank.");
  const closed = (data.settings.closedThrough ?? "").trim();
  if (closed && last.statementDate <= closed) {
    throw new Error(`That statement is inside the closed period (${closed}). Reopen first.`);
  }
  let next = data;
  for (const line of last.lines) {
    next = applyCashRecon(next, { kind: line.kind, sourceId: line.sourceId, recon: "pending" });
  }
  const rest = (next.reconHistory ?? []).filter((r) => r.id !== last.id);
  const prev = rest.filter((r) => r.bankId === bankId).at(-1);
  const bank = next.banks.find((b) => b.id === bankId);
  next = {
    ...next,
    reconHistory: rest,
    banks: next.banks.map((b) =>
      b.id === bankId
        ? {
            ...b,
            lastStatementDate: prev?.statementDate,
            lastStatementEnding: prev?.statementEnding,
          }
        : b,
    ),
  };
  return appendAudit(next, "recon-undo", `Undid ${bank?.nickname ?? "bank"} statement ${last.statementDate}.`, {
    old: String(last.statementEnding),
    new: prev ? String(prev.statementEnding) : "",
  });
}

export function postReconAdjustment(
  data: FinanceData,
  input: { bankId: string; date: string; amount: number; kind: "fee" | "interest"; memo?: string },
): { data: FinanceData; journalId: string } {
  const amount = Math.round(input.amount);
  if (amount <= 0) throw new Error("Amount must be greater than zero.");
  const fees = data.accounts.find((a) => a.code === "5500") ?? data.accounts.find((a) => a.type === "expense");
  const income = data.accounts.find((a) => a.code === "4000") ?? data.accounts.find((a) => a.type === "income");
  if (!fees || !income) throw new Error("Accounts missing.");
  const next =
    input.kind === "fee"
      ? addExpense(data, {
          bankId: input.bankId,
          date: input.date,
          amount,
          accountId: fees.id,
          memo: input.memo || "Bank service charge",
        })
      : addDeposit(data, {
          bankId: input.bankId,
          date: input.date,
          amount,
          accountId: income.id,
          memo: input.memo || "Interest earned",
        });
  const journal = next.journals[next.journals.length - 1];
  return { data: appendAudit(next, "recon-adj", `${input.kind === "fee" ? "Service charge" : "Interest"} ${amount}`, { new: String(amount) }), journalId: journal?.id ?? "" };
}

export function mergeCustomers(data: FinanceData, keepId: string, dropId: string): FinanceData {
  if (keepId === dropId) throw new Error("Pick two different customers.");
  const keep = data.customers.find((c) => c.id === keepId);
  const drop = data.customers.find((c) => c.id === dropId);
  if (!keep || !drop) throw new Error("Customer not found.");
  const invoicesMoved = data.invoices.filter((i) => i.customerId === dropId).map((i) => i.number);
  const receiptsMoved = data.receipts.filter((r) => r.customerId === dropId).map((r) => r.number);
  return appendAudit(
    {
      ...data,
      invoices: data.invoices.map((i) => (i.customerId === dropId ? { ...i, customerId: keepId } : i)),
      receipts: data.receipts.map((r) =>
        r.customerId === dropId ? { ...r, customerId: keepId, receivedFrom: keep.name } : r,
      ),
      customers: data.customers.filter((c) => c.id !== dropId),
    },
    "merge",
    `Merged customer ${drop.name} into ${keep.name}.`,
    {
      old: `${drop.name} (${drop.id}) invoices ${invoicesMoved.join(", ") || "none"} receipts ${receiptsMoved.join(", ") || "none"}`,
      new: `${keep.name} (${keep.id})`,
    },
  );
}

export function mergeVendors(data: FinanceData, keepId: string, dropId: string): FinanceData {
  if (keepId === dropId) throw new Error("Pick two different vendors.");
  const keep = data.vendors.find((v) => v.id === keepId);
  const drop = data.vendors.find((v) => v.id === dropId);
  if (!keep || !drop) throw new Error("Vendor not found.");
  const billsMoved = data.bills.filter((b) => b.vendorId === dropId).map((b) => b.number);
  const checksMoved = data.checks.filter((c) => c.vendorId === dropId).map((c) => c.checkNumber);
  return appendAudit(
    {
      ...data,
      bills: data.bills.map((b) => (b.vendorId === dropId ? { ...b, vendorId: keepId } : b)),
      checks: data.checks.map((c) =>
        c.vendorId === dropId ? { ...c, vendorId: keepId, payee: keep.name } : c,
      ),
      recurrences: (data.recurrences ?? []).map((r) => (r.vendorId === dropId ? { ...r, vendorId: keepId } : r)),
      vendors: data.vendors.filter((v) => v.id !== dropId),
    },
    "merge",
    `Merged vendor ${drop.name} into ${keep.name}.`,
    {
      old: `${drop.name} (${drop.id}) bills ${billsMoved.join(", ") || "none"} checks ${checksMoved.join(", ") || "none"}`,
      new: `${keep.name} (${keep.id})`,
    },
  );
}

export function upsertRecurring(data: FinanceData, item: Omit<RecurringItem, "id"> & { id?: string }): FinanceData {
  const id = item.id ?? newId();
  const next: RecurringItem = {
    id,
    kind: item.kind === "bill" ? "bill" : "check",
    name: item.name.trim() || "Recurring",
    vendorId: item.vendorId,
    amount: Math.round(item.amount),
    bankId: item.bankId,
    accountId: item.accountId,
    memo: item.memo ?? "",
    dayOfMonth: Math.min(28, Math.max(1, Math.round(item.dayOfMonth) || 1)),
    nextDate: item.nextDate,
    active: item.active !== false,
  };
  const exists = (data.recurrences ?? []).some((r) => r.id === id);
  return {
    ...data,
    recurrences: exists
      ? (data.recurrences ?? []).map((r) => (r.id === id ? next : r))
      : [...(data.recurrences ?? []), next],
  };
}

export function removeRecurring(data: FinanceData, id: string): FinanceData {
  return { ...data, recurrences: (data.recurrences ?? []).filter((r) => r.id !== id) };
}

function bumpMonthly(iso: string, dayOfMonth: number): string {
  const next = addMonths(parseISO(iso), 1);
  const y = next.getFullYear();
  const m = next.getMonth();
  const d = Math.min(dayOfMonth, 28);
  return format(new Date(y, m, d), "yyyy-MM-dd");
}

export function postRecurring(data: FinanceData, id: string): FinanceData {
  const item = (data.recurrences ?? []).find((r) => r.id === id);
  if (!item || !item.active) throw new Error("Recurring item not found.");
  const vendor = data.vendors.find((v) => v.id === item.vendorId);
  if (!vendor) throw new Error("Vendor is no longer on file.");
  let next = data;
  if (item.kind === "check") {
    next = issueCheck(next, {
      bankId: item.bankId,
      payee: vendor.name,
      vendorId: vendor.id,
      issueDate: item.nextDate,
      postDate: item.nextDate,
      amount: item.amount,
      memo: item.memo || item.name,
      accountId: item.accountId,
    });
  } else {
    next = createBill(next, {
      vendorId: vendor.id,
      date: item.nextDate,
      dueDate: item.nextDate,
      amount: item.amount,
      accountId: item.accountId,
      memo: item.memo || item.name,
      reference: item.name,
    });
  }
  return appendAudit(
    {
      ...next,
      recurrences: (next.recurrences ?? []).map((r) =>
        r.id === id ? { ...r, nextDate: bumpMonthly(r.nextDate, r.dayOfMonth) } : r,
      ),
    },
    "recurring",
    `Posted ${item.name} for ${item.nextDate}.`,
    { new: item.nextDate },
  );
}

/** Catch up every active recurrence through `through` (rent for Aug and Sep if both are due). */
export function postDueRecurring(
  data: FinanceData,
  through: string,
): { data: FinanceData; posted: Array<{ name: string; date: string }> } {
  let next = data;
  const posted: Array<{ name: string; date: string }> = [];
  for (let i = 0; i < 48; i += 1) {
    const due = (next.recurrences ?? [])
      .filter((r) => r.active && r.nextDate <= through)
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    const item = due[0];
    if (!item) break;
    posted.push({ name: item.name, date: item.nextDate });
    next = postRecurring(next, item.id);
  }
  return { data: next, posted };
}



export function addEmployee(data: FinanceData, input): FinanceData {
  const name = String(input.name ?? "").trim();
  if (!name) throw new Error("Enter an employee name.");
  const employee = {
    id: newId(),
    name,
    title: String(input.title ?? "").trim(),
    email: String(input.email ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    payType: input.payType === "hourly" ? "hourly" : "salary",
    rate: Math.round(Number(input.rate) || 0),
    bankId: String(input.bankId ?? ""),
    hireDate: String(input.hireDate ?? ""),
    active: input.active !== false,
    notes: String(input.notes ?? ""),
    sortOrder: (data.employees ?? []).length,
  };
  return { ...data, employees: [...(data.employees ?? []), employee] };
}

export function updateEmployee(data: FinanceData, id, patch): FinanceData {
  if (!(data.employees ?? []).some((e) => e.id === id)) throw new Error("Employee not found");
  if (patch.name !== undefined && !String(patch.name).trim()) throw new Error("Enter a name.");
  const next = {
    ...data,
    employees: data.employees.map((e) => {
      if (e.id !== id) return e;
      return {
        ...e,
        ...patch,
        name: patch.name !== undefined ? String(patch.name).trim() : e.name,
        title: patch.title !== undefined ? String(patch.title).trim() : e.title,
        email: patch.email !== undefined ? String(patch.email).trim() : e.email,
        phone: patch.phone !== undefined ? String(patch.phone).trim() : e.phone,
        payType: patch.payType === "hourly" || patch.payType === "salary" ? patch.payType : e.payType,
        rate: patch.rate !== undefined ? Math.round(Number(patch.rate) || 0) : e.rate,
        bankId: patch.bankId !== undefined ? String(patch.bankId) : e.bankId,
        hireDate: patch.hireDate !== undefined ? String(patch.hireDate) : e.hireDate,
        active: patch.active !== undefined ? Boolean(patch.active) : e.active,
        notes: patch.notes !== undefined ? String(patch.notes) : e.notes,
      };
    }),
  };
  const nextEmp = next.employees.find((e) => e.id === id)!;
  const marker = `Employee payee (${id})`;
  const linked = next.vendors.find((v) => (v.notes || "").includes(marker));
  if (linked && (linked.name !== nextEmp.name || linked.email !== nextEmp.email || linked.phone !== nextEmp.phone)) {
    return updateVendor(next, linked.id, {
      name: nextEmp.name,
      contact: nextEmp.name,
      email: nextEmp.email || linked.email,
      phone: nextEmp.phone || linked.phone,
    });
  }
  return next;
}

export function removeEmployee(data: FinanceData, id): FinanceData {
  if (!(data.employees ?? []).some((e) => e.id === id)) throw new Error("Employee not found");
  const marker = `Employee payee (${id})`;
  const linked = data.vendors.find((v) => (v.notes || "").includes(marker));
  if (linked) {
    if (data.checks.some((c) => c.vendorId === linked.id && c.status !== "voided" && c.status !== "bounced")) {
      throw new Error("This employee has paychecks. Keep the record for the books.");
    }
    return {
      ...data,
      employees: data.employees.filter((e) => e.id !== id),
      vendors: data.vendors.filter((v) => v.id !== linked.id),
    };
  }
  return { ...data, employees: data.employees.filter((e) => e.id !== id) };
}

export function payEmployee(data: FinanceData, input): FinanceData {
  const employee = (data.employees ?? []).find((e) => e.id === input.employeeId);
  if (!employee) throw new Error("Employee not found");
  if (!employee.active) throw new Error("Employee is inactive.");
  const bankId = input.bankId || employee.bankId;
  const bank = data.banks.find((b) => b.id === bankId);
  if (!bank) throw new Error("Pick a bank to pay from.");
  const amount = Math.round(Number(input.amount) || 0);
  if (amount <= 0) throw new Error("Enter a paycheck amount.");
  const date = input.date || todayIso();
  const payroll = data.accounts.find((a) => a.code === "5300") ?? data.accounts.find((a) => a.type === "expense");
  if (!payroll) throw new Error("Payroll expense account missing.");
  const marker = `Employee payee (${employee.id})`;
  let working = data;
  let vendor = working.vendors.find((v) => (v.notes || "").includes(marker));
  if (!vendor) {
    const vendorId = newId();
    working = addVendor(working, {
      id: vendorId,
      name: employee.name.trim(),
      contact: employee.name.trim(),
      email: employee.email || "",
      phone: employee.phone || "",
      address: "",
      terms: "Due on receipt",
      notes: marker,
      accountNumber: "",
    });
    vendor = working.vendors.find((v) => v.id === vendorId)!;
  } else if (vendor.name !== employee.name.trim()) {
    working = updateVendor(working, vendor.id, {
      name: employee.name.trim(),
      contact: employee.name.trim(),
      email: employee.email || vendor.email,
      phone: employee.phone || vendor.phone,
    });
    vendor = working.vendors.find((v) => v.id === vendor.id)!;
  }
  return issueCheck(working, {
    bankId: bank.id,
    vendorId: vendor.id,
    payee: employee.name,
    issueDate: date,
    postDate: date,
    amount,
    memo: input.memo?.trim() || `Payroll — ${employee.title || "employee"}`,
    accountId: payroll.id,
  });
}
