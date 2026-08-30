import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortDir } from "@/lib/finance/sort";
import { cn } from "@/lib/utils";

export function SortHeader({
  label,
  column,
  sortKey,
  dir,
  onToggle,
  align = "left",
  compact = false,
  className,
}: {
  label: string;
  column: string;
  sortKey: string;
  dir: SortDir;
  onToggle: (column: string) => void;
  align?: "left" | "right" | "center";
  compact?: boolean;
  className?: string;
}) {
  const active = sortKey === column;
  return (
    <th
      className={cn(
        "font-medium",
        compact ? "py-2" : "px-4 py-3",
        compact && align !== "right" && "px-2",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(column)}
        className={cn(
          "inline-flex items-center gap-1 font-medium",
          compact ? "min-h-8 whitespace-nowrap text-xs tracking-wide uppercase" : "min-h-11 text-sm",
          align === "right" && "w-full flex-row-reverse justify-start",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        {active ? dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : compact ? null : (
          <span className="size-3.5" />
        )}
      </button>
    </th>
  );
}
