import { newId } from "./ids";
import type {
  Account,
  AccountType,
  FinanceData,
  JournalEntry,
  JournalLine,
  JournalSource,
} from "./types";

export function normalBalance(type: AccountType): "debit" | "credit" {
  return type === "asset" || type === "expense" ? "debit" : "credit";
}

export function accountBalance(data: FinanceData, accountId: string): number {
  const account = data.accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  let debit = 0;
  let credit = 0;
  for (const entry of data.journals) {
    for (const line of entry.lines) {
      if (line.accountId !== accountId) continue;
      debit += line.debit;
      credit += line.credit;
    }
  }
  return normalBalance(account.type) === "debit" ? debit - credit : credit - debit;
}

export function bankBookBalance(data: FinanceData, bankId: string): number {
  const bank = data.banks.find((b) => b.id === bankId);
  if (!bank) return 0;
  return accountBalance(data, bank.accountId);
}

export function totalCash(data: FinanceData): number {
  return data.banks.filter((b) => !b.archived).reduce((sum, b) => sum + bankBookBalance(data, b.id), 0);
}

export function pendingChecksTotal(data: FinanceData, bankId?: string): number {
  return data.checks
    .filter((c) => c.status === "pending" && (!bankId || c.bankId === bankId))
    .reduce((sum, c) => sum + c.amount, 0);
}

export function invoiceSubtotal(lines: { quantity: number; unitPrice: number }[]): number {
  return lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitPrice), 0);
}

export function invoiceTax(subtotal: number, taxRate: number, taxEnabled: boolean): number {
  if (!taxEnabled || taxRate <= 0) return 0;
  return Math.round((subtotal * taxRate) / 100);
}

export function invoiceTotal(data: FinanceData, invoiceId: string): number {
  const invoice = data.invoices.find((i) => i.id === invoiceId);
  if (!invoice) return 0;
  const sub = invoiceSubtotal(invoice.lines);
  return sub + invoiceTax(sub, invoice.taxRate, data.settings.taxEnabled);
}

export function invoicePaid(invoice: { payments: { amount: number }[] }): number {
  return invoice.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function invoiceBalance(data: FinanceData, invoiceId: string): number {
  const invoice = data.invoices.find((i) => i.id === invoiceId);
  if (!invoice || invoice.status === "void") return 0;
  return Math.max(0, invoiceTotal(data, invoiceId) - invoicePaid(invoice));
}

export function openReceivables(data: FinanceData): number {
  return data.invoices
    .filter((i) => i.status === "sent" || i.status === "partial" || i.status === "draft")
    .reduce((sum, i) => sum + invoiceBalance(data, i.id), 0);
}

export function billPaid(bill: { payments: { amount: number }[] }): number {
  return bill.payments.reduce((sum, p) => sum + p.amount, 0);
}

export function billBalance(bill: { amount: number; status: string; payments: { amount: number }[] }): number {
  if (bill.status === "void") return 0;
  return Math.max(0, bill.amount - billPaid(bill));
}

export function openPayables(data: FinanceData): number {
  return (data.bills ?? [])
    .filter((b) => b.status === "open" || b.status === "partial")
    .reduce((sum, b) => sum + billBalance(b), 0);
}

export function customerOpenBalance(data: FinanceData, customerId: string): number {
  return data.invoices
    .filter((i) => i.customerId === customerId)
    .reduce((sum, i) => sum + invoiceBalance(data, i.id), 0);
}

export function vendorOpenBalance(data: FinanceData, vendorId: string): number {
  return (data.bills ?? [])
    .filter((b) => b.vendorId === vendorId)
    .reduce((sum, b) => sum + billBalance(b), 0);
}

export function receiptTotal(lines: { quantity: number; unitPrice: number }[], taxRate: number, taxEnabled: boolean): number {
  const sub = invoiceSubtotal(lines);
  return sub + invoiceTax(sub, taxRate, taxEnabled);
}

export function findAccount(data: FinanceData, code: string): Account | undefined {
  return data.accounts.find((a) => a.code === code);
}

export function requireAccount(data: FinanceData, code: string): Account {
  const account = findAccount(data, code);
  if (!account) throw new Error(`Missing account ${code}`);
  return account;
}

function line(accountId: string, debit: number, credit: number, memo = ""): JournalLine {
  return { id: newId(), accountId, debit, credit, memo };
}

export function makeJournal(input: {
  date: string;
  description: string;
  sourceType: JournalSource;
  sourceId?: string;
  lines: Array<{ accountId: string; debit: number; credit: number; memo?: string }>;
}): JournalEntry {
  const lines = input.lines.map((l) => line(l.accountId, l.debit, l.credit, l.memo ?? ""));
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  if (debit !== credit) {
    throw new Error(`Unbalanced journal: debit ${debit} credit ${credit}`);
  }
  return {
    id: newId(),
    date: input.date,
    description: input.description,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    lines,
  };
}

export function reverseJournal(entry: JournalEntry, date: string, reason: string): JournalEntry {
  return makeJournal({
    date,
    description: `Reversal: ${reason}`,
    sourceType: "reversal",
    sourceId: entry.id,
    lines: entry.lines.map((l) => ({
      accountId: l.accountId,
      debit: l.credit,
      credit: l.debit,
      memo: l.memo,
    })),
  });
}

export function trialBalance(data: FinanceData): Array<{
  account: Account;
  debit: number;
  credit: number;
  balance: number;
}> {
  return data.accounts
    .map((account) => {
      const balance = accountBalance(data, account.id);
      const debitNormal = normalBalance(account.type) === "debit";
      return {
        account,
        debit: debitNormal && balance > 0 ? balance : !debitNormal && balance < 0 ? -balance : 0,
        credit: !debitNormal && balance > 0 ? balance : debitNormal && balance < 0 ? -balance : 0,
        balance,
      };
    })
    .filter((row) => row.balance !== 0 || row.account.system);
}

export function incomeStatement(data: FinanceData): {
  income: number;
  expense: number;
  net: number;
  byAccount: Array<{ account: Account; amount: number }>;
} {
  const byAccount = data.accounts
    .filter((a) => a.type === "income" || a.type === "expense")
    .map((account) => ({ account, amount: accountBalance(data, account.id) }))
    .filter((row) => row.amount !== 0);
  const income = byAccount.filter((r) => r.account.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = byAccount.filter((r) => r.account.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { income, expense, net: income - expense, byAccount };
}
