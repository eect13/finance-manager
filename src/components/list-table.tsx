import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One name-like column takes leftover width. Keep bank/status/money as fit — not flex. */
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

/** Inline width for <col>: skip flex (CSS 100%) and actions (CSS 1% hug). */
export function listColWidthStyle(id: string, width: number): CSSProperties | undefined {
  if (id === "actions" || FLEX_COL.has(id)) return undefined;
  return { width };
}

/** Register-style card. One flex name col absorbs leftover; fit/actions stay compact. */
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
