import { REGISTER_COLS, type RegisterColId, type RegisterCols } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export function ColumnChips({
  cols,
  onToggle,
  onShowAll,
  compact = false,
}: {
  cols: RegisterCols;
  onToggle: (id: RegisterColId) => void;
  onShowAll?: () => void;
  compact?: boolean;
}) {
  const shown = REGISTER_COLS.filter((col) => cols[col.id]).length;
  const allOn = shown === REGISTER_COLS.length;

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
      <div className="flex flex-wrap gap-1" role="group" aria-label="Register columns">
        {REGISTER_COLS.map((col) => {
          const on = cols[col.id];
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
          Hide columns to fit more of the book on screen. Last balance stays in the totals row.
        </p>
      )}
    </div>
  );
}
