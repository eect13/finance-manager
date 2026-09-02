import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { todayIso } from "./format";
import { openPayables, openReceivables, trialBalance } from "./ledger";
import { bookBalanceOn, lastReconForBank, unclearedLines } from "./reconcile";
import type { FinanceData, RecurringItem } from "./types";

export interface CloseCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  href?: string;
}

export function monthEndIso(iso = todayIso()): string {
  return format(endOfMonth(parseISO(iso.length >= 7 ? `${iso.slice(0, 7)}-01` : iso)), "yyyy-MM-dd");
}

export function monthStartIso(iso = todayIso()): string {
  const src = iso.length >= 7 ? `${iso.slice(0, 7)}-01` : iso;
  return format(startOfMonth(parseISO(src)), "yyyy-MM-dd");
}

export function dueRecurring(data: FinanceData, through: string): RecurringItem[] {
  return (data.recurrences ?? [])
    .filter((r) => r.active && r.nextDate <= through)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate) || a.name.localeCompare(b.name));
}

export function closeChecklist(
  data: FinanceData,
  through: string,
): {
  items: CloseCheck[];
  ok: boolean;
  blockers: string[];
  due: RecurringItem[];
} {
  const items: CloseCheck[] = [];
  const live = data.banks.filter((b) => !b.archived);
  for (const bank of live) {
    const lastRec = lastReconForBank(data, bank.id);
    const last = lastRec?.statementDate ?? "";
    const uncleared = unclearedLines(data, bank.id, through);
    const recd = last !== "" && last >= through;
    const nothing = uncleared.length === 0 && last === "";
    const book = bookBalanceOn(data, bank.id, through);
    const skipEmpty = nothing && book === (bank.openingBalance ?? 0);
    const ok = recd || skipEmpty;
    items.push({
      id: `bank-${bank.id}`,
      label: `${bank.nickname} statement`,
      ok,
      detail: recd
        ? `Finished ${last}`
        : skipEmpty
          ? "No activity — nothing to rec"
          : last
            ? `Last finished ${last}. ${uncleared.length} still uncleared.`
            : `${uncleared.length} uncleared. Finish a statement through ${through}.`,
      href: "/reconcile",
    });
  }

  const due = dueRecurring(data, through);
  items.push({
    id: "recurring",
    label: "Recurring",
    ok: due.length === 0,
    detail: due.length === 0 ? "Nothing due" : `${due.map((r) => r.name).join(", ")} due`,
    href: "/settings",
  });

  const tb = trialBalance(data, through);
  const debit = tb.reduce((s, r) => s + r.debit, 0);
  const credit = tb.reduce((s, r) => s + r.credit, 0);
  items.push({
    id: "tb",
    label: "Trial balance",
    ok: debit === credit,
    detail: debit === credit ? "In balance" : "Out of balance",
    href: "/reports",
  });

  const blockers = items.filter((i) => !i.ok).map((i) => i.detail);
  return { items, ok: blockers.length === 0, blockers, due };
}

export function closeTotals(data: FinanceData, through: string) {
  const banks = data.banks
    .filter((b) => !b.archived)
    .map((b) => ({
      bankId: b.id,
      nickname: b.nickname,
      balance: bookBalanceOn(data, b.id, through),
      lastStatementDate: lastReconForBank(data, b.id)?.statementDate ?? "",
    }));
  const tb = trialBalance(data, through);
  return {
    banks,
    ar: openReceivables(data, through),
    ap: openPayables(data, through),
    tbDebit: tb.reduce((s, r) => s + r.debit, 0),
    tbCredit: tb.reduce((s, r) => s + r.credit, 0),
  };
}
