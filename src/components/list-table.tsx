import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { ACTIONS_COL_MIN, FLEX_COL_MIN } from "@/lib/finance/fit-column";
import { cn } from "@/lib/utils";

/** Name-like columns used to absorb leftover. Lists now lock every col to stored px (sheet-style). */
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
  return "col-fit";
}

/** Inline width for <col>: every list column is a stored px width (drag/auto-fit apply). */
export function listColWidthStyle(_id: string, width: number): CSSProperties | undefined {
  return { width, minWidth: width };
}

/** Table is the sum of columns — leftover is empty paper, not dumped into a neighbor. */
export function listTableStyle(tableWidth: number): CSSProperties {
  const w = Math.max(tableWidth, 1);
  return { width: w, minWidth: w };
}

export function listFlexMinStyle(id: string): CSSProperties | undefined {
  if (id === "actions") return { minWidth: ACTIONS_COL_MIN };
  if (FLEX_COL.has(id)) return { minWidth: FLEX_COL_MIN };
  return undefined;
}

/** Register-style card. Columns keep stored widths; the card side-scrolls when they overflow. */
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
    <div className="list-card px-4 py-6 text-center text-muted-foreground">{children}</div>
  );
}
