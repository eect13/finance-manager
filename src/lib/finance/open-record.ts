import type { KeyboardEvent, MouseEvent } from "react";
import { useFinanceStore } from "./store";
import type { CashLine } from "./register";
import type { FinanceData, OpenKind, OpenTarget } from "./types";

export type { OpenKind, OpenTarget };

export function openTxn(kind: OpenKind, id: string) {
  useFinanceStore.getState().openTxn(kind, id);
}

export function openProps(kind: OpenKind, id: string, opts?: { click?: boolean }) {
  const click = Boolean(opts?.click);
  return {
    "data-open": "true" as const,
    tabIndex: 0,
    title: click ? "Tap to open and edit" : "Double-click or press Enter to open",
    ...(click
      ? {
          onClick: (e: MouseEvent<HTMLElement>) => {
            e.preventDefault();
            openTxn(kind, id);
          },
        }
      : {
          onDoubleClick: (e: MouseEvent<HTMLElement>) => {
            e.preventDefault();
            openTxn(kind, id);
          },
        }),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key !== "Enter" || e.currentTarget !== e.target) return;
      e.preventDefault();
      openTxn(kind, id);
    },
  };
}

export function stopOpen(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export function targetFromCashLine(line: CashLine, data: FinanceData): OpenTarget | null {
  if (!line.sourceId || line.kind === "opening") return null;
  if (line.kind === "check") return { kind: "check", id: line.sourceId };
  if (line.kind === "receipt" || line.kind === "payment") return { kind: "receipt", id: line.sourceId };
  if (line.kind === "bill-payment") {
    const bill = data.bills.find((b) => b.payments.some((p) => p.id === line.sourceId));
    return bill ? { kind: "bill", id: bill.id } : null;
  }
  return { kind: "journal", id: line.sourceId };
}

export function openCashLine(line: CashLine, data: FinanceData) {
  const target = targetFromCashLine(line, data);
  if (target) openTxn(target.kind, target.id);
}
