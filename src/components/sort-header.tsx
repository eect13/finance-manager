import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortDir } from "@/lib/finance/sort";
import { cn } from "@/lib/utils";

export function ColResize({
  width,
  onWidth,
  onFit,
}: {
  width: number;
  onWidth: (next: number) => void;
  onFit?: () => void;
}) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      title="Drag to resize · double-tap or double-click to auto-fit"
      className="col-resize-handle no-print"
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFit?.();
      }}
      onPointerDown={(e) => {
        if (e.detail > 1) return;
        // Phone/tablet: column drag is unusable — CSS hides the handle; skip events too.
        if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startW = width;
        const node = e.currentTarget;
        try {
          node.setPointerCapture(e.pointerId);
        } catch {
          /* synthetic pointer events may not support capture */
        }
        node.dataset.dragging = "true";
        let latest = startW;
        let frame = 0;
        function flush() {
          frame = 0;
          onWidth(latest);
        }
        function move(ev: PointerEvent) {
          latest = startW + (ev.clientX - startX);
          if (frame) return;
          frame = requestAnimationFrame(flush);
        }
        function up() {
          node.dataset.dragging = "";
          if (frame) cancelAnimationFrame(frame);
          onWidth(latest);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
    />
  );
}

export function SortHeader({
  label,
  column,
  sortKey,
  dir,
  onToggle,
  align = "left",
  compact = false,
  className,
  width,
  onWidth,
  onFit,
}: {
  label: string;
  column: string;
  sortKey: string;
  dir: SortDir;
  onToggle: (column: string) => void;
  align?: "left" | "right" | "center";
  compact?: boolean;
  className?: string;
  width?: number;
  onWidth?: (next: number) => void;
  onFit?: () => void;
}) {
  const active = sortKey === column;
  return (
    <th
      className={cn(
        "relative text-center font-medium",
        compact ? "py-2" : "px-4 py-3",
        compact && "px-2",
        className,
      )}
      style={width ? { minWidth: width, width } : undefined}
      data-align={align}
      data-col={column}
    >
      <button
        type="button"
        onClick={() => onToggle(column)}
        className={cn(
          "inline-flex w-full items-center justify-center gap-1 whitespace-nowrap text-center font-medium",
          compact ? "min-h-8 text-xs tracking-wide uppercase" : "min-h-11 text-sm",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        {active ? dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : null}
      </button>
      {onWidth && width != null ? <ColResize width={width} onWidth={onWidth} onFit={onFit} /> : null}
    </th>
  );
}
