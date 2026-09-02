import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Name-like columns take leftover width (CSS grid `1fr`). Actions/money stay content-sized. */
const FLEX_COL = new Set([
  "payee",
  "from",
  "customer",
  "vendor",
  "memo",
  "description",
  "name",
  "nickname",
  "party",
  "bank",
]);

export function listColClass(id: string) {
  if (id === "actions") return "col-actions";
  if (FLEX_COL.has(id)) return "col-flex";
  return "col-fit";
}

/** Register-style card. Flex columns share leftover width — no empty end col. */
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
