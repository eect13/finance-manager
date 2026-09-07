import { useCallback, useEffect, useMemo, useState } from "react";
import { REGISTER_COLS, type RegisterCols } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export type ColChip = { id: string; label: string };

function loadVisible(key: string, ids: readonly string[]): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const id of ids) next[id] = true;
  if (typeof window === "undefined") return next;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return next;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    for (const id of ids) {
      if (typeof saved[id] === "boolean") next[id] = saved[id];
    }
    if (!ids.some((id) => next[id])) {
      for (const id of ids) next[id] = true;
    }
  } catch {
    /* private mode */
  }
  return next;
}

/** Persist show/hide for list columns (Register chips, other Views). Actions/check stay on. */
export function useColVisible(storageKey: string, ids: readonly string[]) {
  const idKey = ids.join(",");
  const idList = useMemo(() => (idKey ? idKey.split(",") : []), [idKey]);
  const [on, setOn] = useState<Record<string, boolean>>(() => loadVisible(storageKey, idList));

  useEffect(() => {
    setOn(loadVisible(storageKey, idList));
  }, [storageKey, idList]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(on));
      } catch {
        /* quota */
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [storageKey, on]);

  const toggle = useCallback(
    (id: string) => {
      if (!idList.includes(id)) return;
      setOn((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        if (!idList.some((k) => next[k])) return prev;
        return next;
      });
    },
    [idList],
  );

  const showAll = useCallback(() => {
    const next: Record<string, boolean> = {};
    for (const id of idList) next[id] = true;
    setOn(next);
  }, [idList]);

  const hideAttrs = useMemo(() => {
    const attrs: Record<string, string> = {};
    for (const id of idList) {
      if (on[id] === false) attrs[`data-hide-${id}`] = "true";
    }
    return attrs;
  }, [idList, on]);

  const hiddenCount = idList.reduce((n, id) => n + (on[id] === false ? 1 : 0), 0);

  return { on, toggle, showAll, hiddenCount, hideAttrs };
}

export function visibleTableWidth(widths: Record<string, number>, visible: Record<string, boolean>) {
  let sum = 0;
  for (const key of Object.keys(widths)) {
    if (visible[key] === false) continue;
    sum += widths[key] ?? 0;
  }
  return sum;
}

export function ColumnChips({
  columns = REGISTER_COLS,
  cols,
  onToggle,
  onShowAll,
  compact = false,
  hint,
}: {
  columns?: readonly ColChip[];
  cols: Record<string, boolean> | RegisterCols;
  onToggle: (id: string) => void;
  onShowAll?: () => void;
  compact?: boolean;
  hint?: string;
}) {
  const map = cols as Record<string, boolean>;
  const shown = columns.filter((col) => map[col.id] !== false).length;
  const allOn = shown === columns.length;

  return (
    <div>
      {compact ? null : (
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Columns</p>
          {onShowAll ? (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground disabled:opacity-40"
              disabled={allOn}
              onClick={onShowAll}
            >
              Show all
            </button>
          ) : null}
        </div>
      )}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Columns">
        {columns.map((col) => {
          const on = map[col.id] !== false;
          return (
            <button
              key={col.id}
              type="button"
              aria-pressed={on}
              aria-label={`${on ? "Hide" : "Show"} ${col.label}`}
              className={cn(
                "inline-flex items-center rounded-full px-3 text-sm font-medium",
                compact ? "h-9 min-h-9" : "h-10 min-h-10",
                on ? "bg-background text-foreground elevation" : "bg-muted text-muted-foreground",
              )}
              onClick={() => onToggle(col.id)}
            >
              {col.label}
            </button>
          );
        })}
        {compact && onShowAll ? (
          <button
            type="button"
            className="inline-flex h-9 min-h-9 items-center rounded-full px-3 text-sm font-medium text-muted-foreground disabled:opacity-40"
            disabled={allOn}
            onClick={onShowAll}
          >
            Show all
          </button>
        ) : null}
      </div>
      {compact ? null : (
        <p className="mt-1 text-xs text-muted-foreground">
          {hint ?? "Toggle columns. On phone, Grid and List both honor these chips."}
        </p>
      )}
    </div>
  );
}

export function viewColumnExtra(columns: readonly ColChip[], vis: ReturnType<typeof useColVisible>) {
  return (
    <ColumnChips
      columns={columns}
      cols={vis.on}
      onToggle={vis.toggle}
      onShowAll={vis.showAll}
      hint="Hide columns you do not need. Phone: tap the column edge to auto-fit."
    />
  );
}
