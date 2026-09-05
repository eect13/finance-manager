import { differenceInCalendarDays, parseISO } from "date-fns";
import { cashBook, compareCashLines, type CashLine } from "./register";
import { todayIso } from "./format";
import type { FinanceData, ReconNamedLine, ReconStatement } from "./types";

function recsForBank(data: FinanceData, bankId: string): ReconStatement[] {
  return (data.reconHistory ?? [])
    .filter((r) => r.bankId === bankId)
    .sort((a, b) => a.statementDate.localeCompare(b.statementDate) || a.finishedAt - b.finishedAt);
}

export function lastReconForBank(data: FinanceData, bankId: string) {
  return recsForBank(data, bankId).at(-1) ?? null;
}

export function lastReconBefore(data: FinanceData, bankId: string, statementDate: string) {
  return recsForBank(data, bankId).filter((r) => r.statementDate < statementDate).at(-1) ?? null;
}

export function lineOnFinishedRecon(
  data: FinanceData,
  kind: string,
  sourceId: string,
  bankId?: string,
): ReconStatement | null {
  for (const rec of data.reconHistory ?? []) {
    // Transfer legs share kind+sourceId; only the statement bank locks that leg.
    if (bankId && rec.bankId !== bankId) continue;
    if (rec.lines.some((l) => l.kind === kind && l.sourceId === sourceId)) return rec;
  }
  return null;
}

/** Last finished statement ending. If none, opening plus already-R lines. */
export function reconBeginning(data: FinanceData, bankId: string, statementDate: string): number {
  const prior = lastReconBefore(data, bankId, statementDate);
  if (prior) return prior.statementEnding;
  const { opening, lines } = cashBook(data, bankId, { dateTo: statementDate });
  let beg = opening;
  for (const line of lines) {
    if (line.kind === "opening") continue;
    if (line.counts && line.recon === "reconciled") beg += line.deposit - line.payment;
  }
  return beg;
}

export function bookBalanceOn(data: FinanceData, bankId: string, asOf: string): number {
  const { opening, lines } = cashBook(data, bankId, { dateTo: asOf });
  return opening + lines.filter((line) => line.counts).reduce((sum, line) => sum + line.deposit - line.payment, 0);
}

/** Posted, not void, not yet R, on or before the statement date. */
export function unclearedLines(data: FinanceData, bankId: string, statementDate: string): CashLine[] {
  const { lines } = cashBook(data, bankId, { dateTo: statementDate });
  const order = data.registerOrder ?? {};
  return lines
    .filter((line) => line.kind !== "opening" && line.counts && line.recon !== "reconciled")
    .sort((a, b) => compareCashLines(a, b, order));
}

export function reconClearedNet(ticked: CashLine[]): number {
  return ticked.reduce((sum, line) => sum + line.deposit - line.payment, 0);
}

/** Statement ending minus (beginning + ticked deposits − ticked payments). Zero to finish. */
export function reconDifference(beginning: number, statementEnding: number, ticked: CashLine[]): number {
  return statementEnding - (beginning + reconClearedNet(ticked));
}

/** Statement + DIT − outstanding − book. Zero when the rec explains. */
export function explainedDifference(statementEnding: number, dit: number, outstanding: number, book: number): number {
  return statementEnding + dit - outstanding - book;
}

export function daysOutstanding(date: string, asOf = todayIso()): number {
  if (!date) return 0;
  return Math.max(0, differenceInCalendarDays(parseISO(asOf), parseISO(date)));
}

export function reconExplain(
  uncleared: CashLine[],
  tickedKeys: Set<string>,
  keyOf: (line: CashLine) => string,
) {
  const outstanding: CashLine[] = [];
  const inTransit: CashLine[] = [];
  for (const line of uncleared) {
    if (tickedKeys.has(keyOf(line))) continue;
    if (line.payment) outstanding.push(line);
    if (line.deposit) inTransit.push(line);
  }
  return {
    outstanding,
    inTransit,
    outstandingTotal: outstanding.reduce((s, l) => s + l.payment, 0),
    inTransitTotal: inTransit.reduce((s, l) => s + l.deposit, 0),
  };
}

export function isReconAdj(line: CashLine): boolean {
  const hay = `${line.memo} ${line.party}`.toLowerCase();
  if (line.kind === "expense" && hay.includes("service charge")) return true;
  if (line.kind === "deposit" && hay.includes("interest")) return true;
  return false;
}

export function namedReconLines(lines: CashLine[], asOf: string, field: "payment" | "deposit"): ReconNamedLine[] {
  return lines.map((line) => ({
    date: line.date,
    party: line.party,
    number: line.number,
    amount: field === "payment" ? line.payment : line.deposit,
    days: daysOutstanding(line.date, asOf),
    kind: line.kind,
    sourceId: line.sourceId,
  }));
}

export function namedFromCash(lines: CashLine[], asOf: string): ReconNamedLine[] {
  return lines.map((line) => ({
    date: line.date,
    party: line.party,
    number: line.number,
    amount: line.payment || line.deposit,
    days: daysOutstanding(line.date, asOf),
    kind: line.kind,
    sourceId: line.sourceId,
  }));
}

export function unclearedAge(lines: CashLine[], asOf: string) {
  const buckets = { d30: 0, d60: 0, d90: 0, late: 0, lateCount: 0 };
  for (const line of lines) {
    const days = daysOutstanding(line.date, asOf);
    const amount = line.payment || line.deposit;
    if (days > 90) {
      buckets.late += amount;
      buckets.lateCount += 1;
    } else if (days > 60) buckets.d90 += amount;
    else if (days > 30) buckets.d60 += amount;
    else buckets.d30 += amount;
  }
  return buckets;
}