import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Check } from "lucide-react";
import type { SortDir } from "@/lib/finance/sort";
import { cn } from "@/lib/utils";
import type { ColAlign } from "@/components/use-col-aligns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LONG_PRESS_MS = 480;
const LONG_PRESS_MOVE_PX = 12;

function isTouchLikePointer(e: { pointerType: string }) {
  if (e.pointerType === "touch" || e.pointerType === "pen") return true;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export function ColResize({
  width,
  onWidth,
  onFit,
}: {
  width: number;
  onWidth: (next: number) => void;
  onFit?: () => void;
}) {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const tapRef = useRef<{ x: number; y: number; id: number } | null>(null);
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={coarse ? "Auto-fit column" : "Resize column"}
      title={
        coarse
          ? "Tap to auto-fit (drag resize is for mouse)"
          : "Drag to resize · double-click to auto-fit"
      }
      className="col-resize-handle no-print"
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFit?.();
      }}
      onPointerDown={(e) => {
        if (e.detail > 1) return;
        if (e.pointerType === "touch" || e.pointerType === "pen") {
          tapRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.stopPropagation();
          return;
        }
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
      onPointerUp={(e) => {
        const tap = tapRef.current;
        tapRef.current = null;
        if (!tap || tap.id !== e.pointerId) return;
        const dx = e.clientX - tap.x;
        const dy = e.clientY - tap.y;
        if (dx * dx + dy * dy > 64) return;
        e.preventDefault();
        e.stopPropagation();
        onFit?.();
      }}
      onPointerCancel={() => {
        tapRef.current = null;
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
  align = "center",
  onAlign,
  compact = false,
  sortable = true,
  className,
  width,
  onWidth,
  onFit,
  /** Ignored: list columns lock stored px like a sheet (no leftover absorber). */
  fill: _fill = false,
}: {
  label: string;
  column: string;
  sortKey: string;
  dir: SortDir;
  onToggle: (column: string) => void;
  align?: ColAlign;
  onAlign?: (align: ColAlign) => void;
  /** Sheet-style uppercase chrome (record lines). List density spacing is CSS --list-* tokens. */
  compact?: boolean;
  /** When false, title is not a sort control (Status on Register). ↑/↓ still show when active. */
  sortable?: boolean;
  className?: string;
  width?: number;
  onWidth?: (next: number) => void;
  onFit?: () => void;
  fill?: boolean;
}) {
  const active = sortable && sortKey === column;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAt, setMenuAt] = useState({ x: 0, y: 0 });
  const hasMenu = Boolean(onAlign);
  const titleTone = "sort-header-label";
  const titleSize = compact ? "min-h-8 text-xs tracking-wide uppercase" : "min-h-11 text-sm";
  const longPressTimer = useRef<number | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const suppressSortClick = useRef(false);

  function clearLongPress() {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressOrigin.current = null;
  }

  function openColumnMenu(x: number, y: number) {
    setMenuAt({ x, y });
    setMenuOpen(true);
  }

  function onColumnMenuKey(e: ReactKeyboardEvent, anchor: HTMLElement | null) {
    if (!hasMenu) return;
    const contextKey = e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey);
    if (!contextKey) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = anchor?.getBoundingClientRect();
    openColumnMenu(rect ? rect.left + rect.width / 2 : 0, rect ? rect.bottom : 0);
  }

  useEffect(() => () => clearLongPress(), []);

  const titleInner = <span className="sort-header-title">{label}</span>;

  return (
    <th
      className={cn(
        "relative align-middle font-medium text-center",
        compact ? "py-2 px-2" : "px-4 py-3",
        className,
      )}
      style={width != null ? { minWidth: width, width } : undefined}
      data-align={align}
      data-col={column}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : sortable ? "none" : undefined}
      onContextMenu={
        hasMenu
          ? (e) => {
              e.preventDefault();
              clearLongPress();
              openColumnMenu(e.clientX, e.clientY);
            }
          : undefined
      }
      onPointerDown={
        hasMenu
          ? (e) => {
              if (e.button !== 0) return;
              if ((e.target as Element | null)?.closest?.(".col-resize-handle")) return;
              if (!isTouchLikePointer(e)) return;
              clearLongPress();
              longPressOrigin.current = { x: e.clientX, y: e.clientY };
              const x = e.clientX;
              const y = e.clientY;
              longPressTimer.current = window.setTimeout(() => {
                longPressTimer.current = null;
                longPressOrigin.current = null;
                suppressSortClick.current = true;
                openColumnMenu(x, y);
                try {
                  navigator.vibrate?.(10);
                } catch {
                  /* ignore */
                }
              }, LONG_PRESS_MS);
            }
          : undefined
      }
      onPointerMove={
        hasMenu
          ? (e) => {
              const origin = longPressOrigin.current;
              if (!origin || longPressTimer.current == null) return;
              const dx = e.clientX - origin.x;
              const dy = e.clientY - origin.y;
              if (dx * dx + dy * dy > LONG_PRESS_MOVE_PX * LONG_PRESS_MOVE_PX) clearLongPress();
            }
          : undefined
      }
      onPointerUp={hasMenu ? () => clearLongPress() : undefined}
      onPointerCancel={hasMenu ? () => clearLongPress() : undefined}
      onPointerLeave={hasMenu ? () => clearLongPress() : undefined}
      onKeyDown={hasMenu ? (e) => onColumnMenuKey(e, e.currentTarget) : undefined}
      title={
        hasMenu
          ? sortable
            ? "Click to sort · right-click, long-press, or Shift+F10 for align"
            : "Right-click, long-press, or Shift+F10 for align"
          : sortable
            ? "Click to sort"
            : undefined
      }
    >
      <div className="sort-header-row h-full">
        <div className="sort-header-cluster">
          {sortable ? (
            <button
              type="button"
              onClick={() => {
                if (suppressSortClick.current) {
                  suppressSortClick.current = false;
                  return;
                }
                onToggle(column);
              }}
              onKeyDown={(e) => onColumnMenuKey(e, e.currentTarget)}
              className={cn("sort-header-main", titleSize, titleTone)}
            >
              {titleInner}
            </button>
          ) : (
            <span className={cn("sort-header-main sort-header-label", titleSize)}>{titleInner}</span>
          )}
          {active ? (
            <span className="sort-header-controls" aria-hidden="false">
              <span className="sort-header-dir">
                {dir === "asc" ? <ArrowUp className="size-3.5 shrink-0" /> : <ArrowDown className="size-3.5 shrink-0" />}
              </span>
            </span>
          ) : null}
        </div>
      </div>
      {/* Hidden trigger: right-click / long-press opens align menu (no header ⋮ chrome). */}
      {hasMenu ? (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none fixed size-0 overflow-hidden opacity-0"
              style={{ left: menuAt.x, top: menuAt.y }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            {onFit ? (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    onFit();
                  }}
                >
                  Auto-fit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
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
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {onWidth && width != null ? <ColResize width={width} onWidth={onWidth} onFit={onFit} /> : null}
    </th>
  );
}

/** Last-col Actions header: visible label, resize + dblclick/right-click/long-press fit (no sort, no filter, no ⋮). */
export function ActionsHeader({
  width,
  onWidth,
  onFit,
  className,
}: {
  width: number;
  onWidth: (next: number) => void;
  onFit?: () => void;
  className?: string;
}) {
  const longPressTimer = useRef<number | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);

  function clearLongPress() {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressOrigin.current = null;
  }

  useEffect(() => () => clearLongPress(), []);

  return (
    <th
      className={cn("col-actions relative align-middle px-4 py-3 font-medium text-center", className)}
      style={{ minWidth: width, width }}
      data-col="actions"
      data-sortable="false"
      title="Drag to resize · double-click, right-click, or long-press to auto-fit"
      onContextMenu={
        onFit
          ? (e) => {
              e.preventDefault();
              clearLongPress();
              onFit();
            }
          : undefined
      }
      onPointerDown={
        onFit
          ? (e) => {
              if (e.button !== 0) return;
              if ((e.target as Element | null)?.closest?.(".col-resize-handle")) return;
              if (!isTouchLikePointer(e)) return;
              clearLongPress();
              longPressOrigin.current = { x: e.clientX, y: e.clientY };
              longPressTimer.current = window.setTimeout(() => {
                longPressTimer.current = null;
                longPressOrigin.current = null;
                onFit();
                try {
                  navigator.vibrate?.(10);
                } catch {
                  /* ignore */
                }
              }, LONG_PRESS_MS);
            }
          : undefined
      }
      onPointerMove={
        onFit
          ? (e) => {
              const origin = longPressOrigin.current;
              if (!origin || longPressTimer.current == null) return;
              const dx = e.clientX - origin.x;
              const dy = e.clientY - origin.y;
              if (dx * dx + dy * dy > LONG_PRESS_MOVE_PX * LONG_PRESS_MOVE_PX) clearLongPress();
            }
          : undefined
      }
      onPointerUp={onFit ? () => clearLongPress() : undefined}
      onPointerCancel={onFit ? () => clearLongPress() : undefined}
      onPointerLeave={onFit ? () => clearLongPress() : undefined}
    >
      <div className="sort-header-row h-full">
        <div className="sort-header-cluster">
          <span className="sort-header-main sort-header-label actions-header-title min-h-11 text-sm">
            <span className="sort-header-title">Actions</span>
          </span>
        </div>
      </div>
      <ColResize width={width} onWidth={onWidth} onFit={onFit} />
    </th>
  );
}
