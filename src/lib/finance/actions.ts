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
} from "./types";
import type { CashLineKind } from "./register";
import { methodNeedsReference, methodLabel } from "./methods";

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
      id: newId(),
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
      id: newId(),
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
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
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
      memo: input.memo,
      accountId: input.accountId,
      journalId: journal.id,
      vendorId: input.vendorId
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
  const total = sub + invoiceTax(sub, taxRate, data.settings.taxEnabled);
  const status = input.status ?? "sent";
  let journalId;
  const journals = [...data.journals];
  if (status === "sent" && total > 0) {
    const ar = data.accounts.find((a) => a.code === "1200");
    const sales = data.accounts.find((a) => a.code === "4000");
    if (!ar || !sales) throw new Error("AR or income account missing");
    const journal = makeJournal({
      date: input.date,
      description: `Invoice ${number} — ${customer.name}`,
      sourceType: "invoice",
      sourceId: id,
      lines: [{
        accountId: ar.id,
        debit: total,
        credit: 0
      }, {
        accountId: sales.id,
        debit: 0,
        credit: total
      }]
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
      journalId
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
    sortOrder: data.receipts.length
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
  const bank = data.banks.find((b) => b.id === input.bankId);
  if (!bank) throw new Error("Bank not found");
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
  const amount = receiptTotal(lines, taxRate, data.settings.taxEnabled);
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  const sales = data.accounts.find((a) => a.code === "4000");
  if (!sales) throw new Error("Income account missing");
  const id = newId();
  const number = nextReceiptNumber(data, input.date);
  const receivedFrom = input.receivedFrom.trim() || data.customers.find((c) => c.id === input.customerId)?.name || "Walk-in";
  const checkBit = method === "check" ? `Check ${checkNumber} ` : method === "card" ? `Card ${checkNumber} ` : method === "echeck" ? `e-Check ${checkNumber} ` : "";
  const journal = makeJournal({
    date: input.date,
    description: `${checkBit}Receipt ${number} — ${receivedFrom}`.trim(),
    sourceType: "receipt",
    sourceId: id,
    lines: [{
      accountId: bank.accountId,
      debit: amount,
      credit: 0
    }, {
      accountId: sales.id,
      debit: 0,
      credit: amount
    }]
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
    sortOrder: data.receipts.length
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
    sortOrder: data.bills.length
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
    journalId: journal.id
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
  if (line.kind === "check") return removeCheck(data, line.sourceId);
  if (line.kind === "receipt" || line.kind === "payment") return removeReceipt(data, line.sourceId);
  if (line.kind === "bill-payment") return removeBillPayment(data, line.sourceId);
  if (line.kind === "deposit" || line.kind === "expense" || line.kind === "transfer") return dropJournalsAndReversals(data, [line.sourceId]);
  throw new Error("This line cannot be deleted.");
}
export function removeCashLines(data: FinanceData, lines): FinanceData {
  let next = data;
  let deleted = 0;
  for (const line of lines) try {
    next = removeCashLine(next, line);
    deleted += 1;
  } catch {}
  if (deleted === 0) throw new Error("Could not delete those entries.");
  return next;
}
export function reorderBills(data: FinanceData, ids): FinanceData {
  return {
    ...data,
    bills: applyOrder(data.bills, ids)
  };
}
export function addDeposit(data: FinanceData, input): FinanceData {
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Pick a valid date.");
  if (input.kind === "check") return rescheduleCheck(data, input.sourceId, input.date);
  if (input.kind === "receipt") return rescheduleReceipt(data, input.sourceId, input.date);
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
  next = patchJournalAmount(next, receipt.journalId, {
    date,
    description: `${checkBit}Receipt ${receipt.number} — ${receivedFrom}`.trim(),
    amount,
    memo,
    debitAccountId: bank.accountId
  });
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
  const total = sub + invoiceTax(sub, taxRate, data.settings.taxEnabled);
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  if (total < paid) throw new Error("Total cannot be less than already paid.");
  const status = invoice.status === "draft" ? "draft" : paid <= 0 ? "sent" : paid >= total ? "paid" : "partial";
  const customer = data.customers.find((c) => c.id === invoice.customerId);
  let next = data;
  if (invoice.journalId) next = patchJournalAmount(next, invoice.journalId, {
    date,
    description: `Invoice ${invoice.number} — ${customer?.name ?? ""}`.trim(),
    amount: total
  });
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
