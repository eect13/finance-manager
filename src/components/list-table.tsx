import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { ACTIONS_COL_MIN, FLEX_COL_MIN } from "@/lib/finance/fit-column";
import { cn } from "@/lib/utils";

/** One name-like column takes leftover width. Keep bank/status/money/actions as fit — not flex. */
const FLEX_COL = new Set([
  "payee",
  "from",
  "customer",
  "vendor",
  "memo",
  "description",
  "name",
  "party",
  "account",
  "detail",
]);

export function isListFlexCol(id: string) {
  return FLEX_COL.has(id);
}

export function listColClass(id: string) {
  if (id === "actions") return "col-actions";
  if (FLEX_COL.has(id)) return "col-flex";
  return "col-fit";
}

/** Inline width for <col>: flex cols keep a drag min so every column is adjustable. */
export function listColWidthStyle(id: string, width: number): CSSProperties | undefined {
  if (FLEX_COL.has(id)) return { minWidth: width };
  return { width, minWidth: width };
}

/** Desk lists: fill card when roomy; minWidth keeps readable cols and enables card scroll (no crush). */
export function listTableStyle(tableWidth: number): CSSProperties {
  return { width: "100%", minWidth: Math.max(tableWidth, 1) };
}

export function listFlexMinStyle(id: string): CSSProperties | undefined {
  if (id === "actions") return { minWidth: ACTIONS_COL_MIN };
  if (FLEX_COL.has(id)) return { minWidth: FLEX_COL_MIN };
  return undefined;
}

/** Register-style card. One flex name col absorbs leftover; fit cols + Actions use stored widths. */
export const ListCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ListCard(
  { className, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn("list-card list-grid list-scroll", className)} {...rest}>
      {children}
    </div>
  );
});

export function ListEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="list-card px-4 py-6 text-center text-sm text-muted-foreground">{children}</div>
  );
}
