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

function nameWords(name: string): string[] {
  return name
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);
}

function textHit(payee: string, memo: string, words: string[]): boolean {
  if (words.length === 0) return false;
  const have = new Set(
    `${payee} ${memo}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
  return words.every((word) => have.has(word));
}

/** Exact, or a half-month / double of the budget line. */
function amountRelation(amount: number, budget: number): "exact" | "portion" | "none" {
  if (!amount || !budget) return "none";
  if (amount === budget) return "exact";
  if (amount * 2 === budget || budget * 2 === amount) return "portion";
  return "none";
}

type CoverSlot = { item: BudgetItem; covered: number; words: string[] };

function slotsFor(data: FinanceData, month: string, cache: Map<string, CoverSlot[]>): CoverSlot[] {
  const hit = cache.get(month);
  if (hit) return hit;
  const slots = data.budgetItems
    .filter((item) => item.startMonth <= month && item.amount > 0)
    .map((item) => ({ item, covered: 0, words: nameWords(item.name) }));
  cache.set(month, slots);
  return slots;
}

/** Assign this document to one budget line. Returns nothing; mutates `covered`. */
function claim(
  slots: CoverSlot[],
  kind: "inflow" | "outflow",
  amount: number,
  payee: string,
  memo: string,
  accountId: string,
  anyInflow: boolean,
) {
  if (amount <= 0) return;
  let best: CoverSlot | null = null;
  let score = 0;
  for (const slot of slots) {
    if (slot.item.kind !== kind || slot.covered >= slot.item.amount) continue;
    const named = textHit(payee, memo, slot.words);
    const acct = Boolean(slot.item.accountId) && slot.item.accountId === accountId;
    const rel = amountRelation(amount, slot.item.amount);
    let s = 0;
    if (kind === "inflow" && anyInflow) s = named ? 3 : 1;
    else if (named) s = 4;
    else if (acct && rel !== "none") s = rel === "exact" ? 3 : 2;
    if (s > score) {
      score = s;
      best = slot;
    }
  }
  if (!best) return;
  best.covered += Math.min(best.item.amount - best.covered, amount);
}

/**
 * One pass over checks, bills, and invoices.
 * `covered` is how much of each budget line that month already explains.
 * Open invoices and bills dated before `start` are not in these maps — the caller parks them on `start`.
 */
function coverByMonth(data: FinanceData, fromMonth: string): Map<string, CoverSlot[]> {
  const cache = new Map<string, CoverSlot[]>();
  const take = (month: string) => (month >= fromMonth ? slotsFor(data, month, cache) : null);

  for (const chk of data.checks) {
    if (chk.status === "voided" || chk.status === "bounced") continue;
    const month = monthOf(chk.postDate || chk.issueDate);
    const slots = take(month);
    if (!slots) continue;
    claim(slots, "outflow", chk.amount, chk.payee, chk.memo ?? "", chk.accountId ?? "", false);
  }
  for (const bill of data.bills ?? []) {
    if (bill.status === "void") continue;
    const month = monthOf(bill.dueDate || bill.date);
    const slots = take(month);
    if (!slots) continue;
    claim(slots, "outflow", bill.amount, "", bill.memo ?? "", bill.accountId ?? "", false);
  }
  for (const inv of data.invoices) {
    if (inv.status !== "sent" && inv.status !== "partial") continue;
    const month = monthOf(inv.dueDate || inv.date);
    const slots = take(month);
    if (!slots) continue;
    claim(slots, "inflow", invoiceBalance(data, inv.id), "", "", "", true);
  }
  return cache;
}

/** Start of the cash path: today, or the day after a lock that is still in the future. */
export function forecastAsOf(data: FinanceData, now = todayIso()): string {
  const closed = (data.settings.closedThrough || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(closed) && closed >= now) return addDaysIso(closed, 1);
  return now;
}

/** True when that month already has a check or an open bill on this account. */
export function monthAlreadyHasAccountCash(data: FinanceData, accountId: string, month: string): boolean {
  if (!accountId || month.length < 7) return false;
  for (const chk of data.checks) {
    if (chk.accountId !== accountId) continue;
    if (chk.status === "voided" || chk.status === "bounced") continue;
    if (monthOf(chk.postDate || chk.issueDate) === month) return true;
  }
  for (const bill of data.bills ?? []) {
    if (bill.accountId !== accountId || bill.status === "void" || bill.status === "paid") continue;
    if (monthOf(bill.dueDate || bill.date) === month) return true;
  }
  return false;
}

/** True when matching cash or invoices already fill this budget line for the month. */
export function budgetItemCovered(data: FinanceData, item: BudgetItem, month: string): boolean {
  if (!item.amount) return monthAlreadyHasAccountCash(data, item.accountId ?? "", month);
  const row = coverByMonth(data, month).get(month)?.find((s) => s.item.id === item.id);
  return Boolean(row && row.covered >= item.amount);
}

export function cashForecast(data: FinanceData, days = 90, asOf = forecastAsOf(data)): ForecastPoint[] {
  const start = asOf;
  const thisMonth = start.slice(0, 7);
  let cash = totalCash(data) + pendingChecksTotal(data);
  const points: ForecastPoint[] = [];
  const inByDate = new Map<string, number>();
  const outByDate = new Map<string, number>();
  const covered = coverByMonth(data, thisMonth);

  for (const inv of data.invoices) {
    if (inv.status !== "sent" && inv.status !== "partial") continue;
    const due = inv.dueDate || inv.date || start;
    bump(inByDate, due < start ? start : due, invoiceBalance(data, inv.id));
  }
  for (const chk of data.checks) {
    if (chk.status !== "pending") continue;
    const when = chk.postDate || chk.issueDate;
    if (when >= start) bump(outByDate, when, chk.amount);
  }
  for (const bill of data.bills ?? []) {
    if (bill.status !== "open" && bill.status !== "partial") continue;
    const due = bill.dueDate || bill.date || start;
    bump(outByDate, due < start ? start : due, billBalance(bill));
  }

  for (let i = 0; i < days; i += 1) {
    const date = addDaysIso(start, i);
    let inflows = inByDate.get(date) ?? 0;
    let outflows = outByDate.get(date) ?? 0;
    const month = date.slice(0, 7);
    // This month's leftover budget lands today. Later months land on the 1st.
    const apply = month === thisMonth ? start : `${month}-01`;
    if (date === apply) {
      for (const slot of covered.get(month) ?? []) {
        const gap = slot.item.amount - slot.covered;
        if (gap <= 0) continue;
        if (slot.item.kind === "inflow") inflows += gap;
        else outflows += gap;
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
