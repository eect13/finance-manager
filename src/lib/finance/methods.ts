import { Banknote, CreditCard, Landmark, MoreHorizontal, NotebookPen } from "lucide-react";
import type { ReceiptMethod } from "./types";

export const PAYMENT_METHODS: Array<{
  value: ReceiptMethod;
  label: string;
  short: string;
  icon: typeof Banknote;
}> = [
  { value: "cash", label: "Cash", short: "Cash", icon: Banknote },
  { value: "check", label: "Check", short: "Check", icon: NotebookPen },
  { value: "card", label: "Credit / Debit", short: "Card", icon: CreditCard },
  { value: "echeck", label: "e-Check", short: "e-Check", icon: Landmark },
  { value: "other", label: "More", short: "Other", icon: MoreHorizontal },
];

export function methodLabel(method?: ReceiptMethod): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? "Cash";
}

export function methodNeedsReference(method: ReceiptMethod): boolean {
  return method === "check" || method === "echeck" || method === "card";
}

export function methodRefLabel(method: ReceiptMethod): string {
  if (method === "check") return "Check #";
  if (method === "echeck") return "e-Check #";
  if (method === "card") return "Card last 4";
  return "Reference #";
}

export function parseMethod(value: unknown): ReceiptMethod {
  if (value === "check" || value === "card" || value === "echeck" || value === "other") return value;
  return "cash";
}
