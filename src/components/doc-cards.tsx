import type { ReactNode } from "react";
import { useRef } from "react";
import { ListEmpty } from "@/components/list-table";
import { Money } from "@/components/money";
import { useCardLanes, useCardVirtualizer } from "@/components/use-list-virtualizer";
import { cn } from "@/lib/utils";

export function CardGrid<T>({
  items,
  empty,
  getId,
  estimateSize = 110,
  compact,
  className,
  children,
}: {
  items: T[];
  empty: string;
  getId: (item: T) => string;
  estimateSize?: number;
  compact?: boolean;
  className?: string;
  children: (item: T) => ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lanes = useCardLanes(compact);
  const virt = useCardVirtualizer(
    items.length,
    wrapRef,
    (index) => {
      const row = items[index];
      return row ? getId(row) : index;
    },
    estimateSize,
    lanes,
    items.length > 0,
  );
  if (items.length === 0) return <ListEmpty>{empty}</ListEmpty>;
  return (
    <div ref={wrapRef} className={cn("item-cards item-cards-virt", className)} style={{ height: virt.totalSize }}>
      {virt.items.map((v) => {
        const item = items[v.index];
        if (!item) return null;
        return (
          <div
            key={String(v.key)}
            data-index={v.index}
            ref={virt.measureElement}
            className="item-card-virt"
            style={{
              position: "absolute",
              top: 0,
              left: `calc(${v.lane} * 100% / ${lanes})`,
              width: `calc(100% / ${lanes})`,
              paddingLeft: v.lane > 0 ? virt.gap / 2 : 0,
              paddingRight: v.lane < lanes - 1 ? virt.gap / 2 : 0,
              transform: `translateY(${Math.max(0, v.start - virt.scrollMargin)}px)`,
            }}
          >
            {children(item)}
          </div>
        );
      })}
    </div>
  );
}

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
    /** Optional open balance (party txn Grid). */
    open?: number | null;
    /** Optional running balance; wraps under Open when the card is narrow. */
    balance?: number | null;
    currency?: string;
    status?: ReactNode;
    onOpen: () => void;
  }>;
}) {
  return (
    <CardGrid items={rows} empty={empty} getId={(row) => row.id}>
      {(row) => (
        <button type="button" className="item-card" onClick={row.onOpen}>
          <span className="flex items-start justify-between gap-2">
            <span className="item-card-title block min-w-0 break-words font-medium">{row.title}</span>
            {row.status ? <span className="shrink-0">{row.status}</span> : null}
          </span>
          {row.meta ? <span className="item-card-meta block break-words text-muted-foreground">{row.meta}</span> : null}
          {row.amount != null ? (
            <Money
              amount={row.amount}
              currency={row.currency ?? ""}
              className="item-card-amount mt-1 font-medium tabular-nums"
            />
          ) : null}
          {row.open != null || row.balance != null ? (
            <div className="item-card-meta mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-muted-foreground">
              {row.open != null ? (
                <span className="whitespace-nowrap">
                  Open{" "}
                  <Money
                    amount={row.open}
                    currency={row.currency ?? ""}
                    className="font-medium text-foreground tabular-nums"
                  />
                </span>
              ) : null}
              {row.balance != null ? (
                <span className="item-card-balance whitespace-nowrap">
                  Balance{" "}
                  <Money
                    amount={row.balance}
                    currency={row.currency ?? ""}
                    className="font-medium text-foreground tabular-nums"
                  />
                </span>
              ) : null}
            </div>
          ) : null}
        </button>
      )}
    </CardGrid>
  );
}
