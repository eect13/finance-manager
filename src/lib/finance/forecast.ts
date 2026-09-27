import { addDaysIso, todayIso } from "./format";
import { billBalance, invoiceBalance, openPayables, pendingChecksTotal, totalCash } from "./ledger";
import type { BudgetItem, FinanceData } from "./types";

export interface ForecastPoint {
  date: string;
  cash: number;
  inflows: number;
  outflows: number;
}

function bump(map: Map<string, number>, date: string, amount: number) {
  if (!amount) return;
  map.set(date, (map.get(date) ?? 0) + amount);
}

function monthOf(iso: string): string {
  return (iso || "").slice(0, 7);
}

function amountHitsBudget(amount: number, budget: number): boolean {
  if (!amount || !budget) return false;
  return amount === budget || amount * 2 === budget || budget * 2 === amount;
}

function textHitsBudget(payee: string, memo: string, item: BudgetItem): boolean {
  const token = item.name.trim().toLowerCase().split(/\s+/)[0] || "";
  if (token.length < 3) return false;
  return `${payee} ${memo}`.toLowerCase().includes(token);
}

/** Start of the cash path: today, or the day after a lock that is still in the future. */
export function forecastAsOf(data: FinanceData, now = todayIso()): string {
  const closed = (data.settings.closedThrough || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(closed) && closed >= now) return addDaysIso(closed, 1);
  return now;
}

/** True when that month already has a check or an open bill on this account — the budget would count it twice. */
export function monthAlreadyHasAccountCash(data: FinanceData, accountId: string, month: string): boolean {
  return budgetItemCovered(data, { id: "", name: "", kind: "outflow", amount: 0, cadence: "monthly", startMonth: "", accountId }, month);
}

/** Skip this budget line when the month already has matching cash or invoices. */
export function budgetItemCovered(data: FinanceData, item: BudgetItem, month: string): boolean {
  if (!month || month.length < 7) return false;
  if (item.kind === "inflow") {
    let open = 0;
    for (const inv of data.invoices) {
      if (inv.status !== "sent" && inv.status !== "partial") continue;
      if (monthOf(inv.dueDate || inv.date) !== month) continue;
      open += invoiceBalance(data, inv.id);
    }
    return item.amount > 0 && open >= item.amount;
  }

  for (const chk of data.checks) {
    if (chk.status === "voided" || chk.status === "bounced") continue;
    if (monthOf(chk.postDate || chk.issueDate) !== month) continue;
    const text = textHitsBudget(chk.payee, chk.memo ?? "", item);
    const acct = Boolean(item.accountId) && chk.accountId === item.accountId;
    const amt = amountHitsBudget(chk.amount, item.amount);
    if (text || amt || (acct && (text || amt))) return true;
    if (acct && !item.amount) return true;
  }
  for (const bill of data.bills ?? []) {
    if (bill.status !== "open" && bill.status !== "partial") continue;
    if (monthOf(bill.dueDate || bill.date) !== month) continue;
    const text = textHitsBudget("", bill.memo ?? "", item);
    const acct = Boolean(item.accountId) && bill.accountId === item.accountId;
    const amt = amountHitsBudget(billBalance(bill), item.amount);
    if (text || amt || (acct && (text || amt))) return true;
    if (acct && !item.amount) return true;
  }
  return false;
}

export function cashForecast(data: FinanceData, days = 90, asOf = forecastAsOf(data)): ForecastPoint[] {
  const start = asOf;
  const thisMonth = start.slice(0, 7);
  let cash = totalCash(data) + pendingChecksTotal(data);
  const points: ForecastPoint[] = [];
  const inByDate = new Map<string, number>();
  const outByDate = new Map<string, number>();

  for (const inv of data.invoices) {
    if (inv.status !== "sent" && inv.status !== "partial") continue;
    bump(inByDate, inv.dueDate, invoiceBalance(data, inv.id));
  }
  for (const chk of data.checks) {
    if (chk.status !== "pending") continue;
    bump(outByDate, chk.postDate || chk.issueDate, chk.amount);
  }
  for (const bill of data.bills ?? []) {
    if (bill.status !== "open" && bill.status !== "partial") continue;
    bump(outByDate, bill.dueDate, billBalance(bill));
  }

  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(start, i);
    let inflows = inByDate.get(date) ?? 0;
    let outflows = outByDate.get(date) ?? 0;

    const month = date.slice(0, 7);
    if (date.slice(8, 10) === "01" && month > thisMonth) {
      for (const item of data.budgetItems) {
        if (item.startMonth > month) continue;
        if (budgetItemCovered(data, item, month)) continue;
        if (item.kind === "inflow") inflows += item.amount;
        else outflows += item.amount;
      }
    }

    cash += inflows - outflows;
    points.push({ date, cash, inflows, outflows });
  }

  return points;
}

export function projectedCash(data: FinanceData): number {
  const receivables = data.invoices
    .filter((i) => i.status === "sent" || i.status === "partial")
    .reduce((s, i) => s + invoiceBalance(data, i.id), 0);
  return totalCash(data) + receivables - openPayables(data);
}
