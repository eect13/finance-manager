import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Check, MoreVertical } from "lucide-react";
import type { SortDir } from "@/lib/finance/sort";
import { cn } from "@/lib/utils";
import type { ColAlign } from "@/components/use-col-aligns";
import { headerJustify } from "@/components/use-col-aligns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startW = width;
        const node = e.currentTarget;
        try {
          node.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
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
  onAlign,
  visible,
  onVisible,
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
  align?: ColAlign;
  onAlign?: (align: ColAlign) => void;
  visible?: boolean;
  onVisible?: (on: boolean) => void;
  compact?: boolean;
  className?: string;
  width?: number;
  onWidth?: (next: number) => void;
  onFit?: () => void;
}) {
  const active = sortKey === column;
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = Boolean(onAlign || onVisible);

  return (
    <th
      className={cn(
        "relative font-medium",
        align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
        compact ? "py-2 px-2" : "px-4 py-3",
        className,
      )}
      style={width ? { minWidth: width, width } : undefined}
      data-align={align}
      data-col={column}
      onContextMenu={
        hasMenu
          ? (e) => {
              e.preventDefault();
              setMenuOpen(true);
            }
          : undefined
      }
      title={hasMenu ? "Click to sort · right-click for align / column options" : undefined}
    >
      <div className={cn("flex w-full items-center gap-0.5", headerJustify(align))}>
        <button
          type="button"
          onClick={() => onToggle(column)}
          className={cn(
            "inline-flex min-w-0 items-center gap-1 whitespace-nowrap font-medium",
            align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
            compact ? "min-h-8 text-xs tracking-wide uppercase" : "min-h-11 text-sm",
            active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
          {active ? dir === "asc" ? <ArrowUp className="size-3.5 shrink-0" /> : <ArrowDown className="size-3.5 shrink-0" /> : null}
        </button>
        {hasMenu ? (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="col-opts-trigger no-print inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-60 hover:bg-muted hover:opacity-100"
                aria-label={`${label} column options`}
                title="Align or hide column"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              <DropdownMenuLabel>{label}</DropdownMenuLabel>
              {onAlign ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[0.65rem] uppercase tracking-wide">Align</DropdownMenuLabel>
                  {(
                    [
                      ["left", "Left", AlignLeft],
                      ["center", "Center", AlignCenter],
                      ["right", "Right", AlignRight],
                    ] as const
                  ).map(([id, text, Icon]) => (
                    <DropdownMenuItem key={id} onClick={() => onAlign(id)}>
                      <Icon className="size-3.5" />
                      {text}
                      {align === id ? <Check className="ml-auto size-3.5" /> : null}
                    </DropdownMenuItem>
                  ))}
                </>
              ) : null}
              {onVisible ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onVisible(!(visible ?? true))}>
                    {visible === false ? "Show column" : "Hide column"}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {onWidth && width != null ? <ColResize width={width} onWidth={onWidth} onFit={onFit} /> : null}
    </th>
  );
}
