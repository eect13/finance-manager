import type { ReactNode } from "react";
import { ListEmpty } from "@/components/list-table";
import { Money } from "@/components/money";

export function DocCards({
  rows,
  empty,
}: {
  empty: string;
  rows: Array<{
    id: string;
    title: string;
    meta?: string;
    amount?: number;
    currency?: string;
    status?: ReactNode;
    onOpen: () => void;
  }>;
}) {
  if (rows.length === 0) return <ListEmpty>{empty}</ListEmpty>;
  return (
    <div className="item-cards">
      {rows.map((row) => (
        <button key={row.id} type="button" className="item-card" onClick={row.onOpen}>
          <span className="flex items-start justify-between gap-2">
            <span className="block min-w-0 break-words font-medium">{row.title}</span>
            {row.status ? <span className="shrink-0">{row.status}</span> : null}
          </span>
          {row.meta ? <span className="block break-words text-xs text-muted-foreground">{row.meta}</span> : null}
          {row.amount != null ? (
            <Money
              amount={row.amount}
              currency={row.currency ?? ""}
              className="mt-auto pt-2 text-xl font-medium tabular-nums"
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}
