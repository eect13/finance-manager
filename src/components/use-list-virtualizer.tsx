import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useListDensity } from "@/lib/list-density";
import { getWorkspaceScrollElement, listScrollMargin } from "@/lib/workspace-scroll";

/**
 * Match CSS `--list-cell-py`: comfortable 0.65rem, compact 0.4rem.
 * Vertical pad shrink in Compact is 2 × Δpy (top + bottom).
 */
export const LIST_CELL_PY_REM = { comfortable: 0.65, compact: 0.4 } as const;

/** Compact card estimate shrink vs Comfortable — ~8px at 16px root (not magic −20 / −12). */
export function cardDensityPadDeltaPx(compact: boolean, rootFontPx = 16): number {
  if (!compact) return 0;
  return Math.round((LIST_CELL_PY_REM.comfortable - LIST_CELL_PY_REM.compact) * 2 * rootFontPx);
}

/** List-row estimate — desk Compact ~40 / Comfortable ~48; narrow +4. */
export function listRowEstimateSize(compact: boolean, narrow = false): number {
  if (compact) return narrow ? 44 : 40;
  return narrow ? 52 : 48;
}

/**
 * Grid card estimate. Default base 110 matches CardGrid; Register/Reconcile pass
 * 148 / 168. Density delta is shared token math (`cardDensityPadDeltaPx`).
 */
export function cardEstimateSize(compact: boolean, baseComfortable = 110): number {
  return baseComfortable - cardDensityPadDeltaPx(compact);
}

/** ListCard (capped overflow-y) is the Y scroller; otherwise workspace, like Register.
 * Walk ancestors — CardGrid lives inside `.party-pane-list` (max-height + overflow auto),
 * so using only the wrap node bound virt to the workspace and painted a huge empty pad.
 */
function resolveScrollParent(node: HTMLElement | null): HTMLElement | null {
  const workspace = getWorkspaceScrollElement();
  if (!node || typeof getComputedStyle === "undefined") return workspace;
  let el: HTMLElement | null = node;
  while (el && el !== workspace) {
    const style = getComputedStyle(el);
    const canY = style.overflowY === "auto" || style.overflowY === "scroll";
    if (canY) {
      const maxH = style.maxHeight;
      const capped = maxH !== "none" && maxH !== "" && Number.parseFloat(maxH) > 0;
      if (capped) return el;
      if (el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1) return el;
    }
    el = el.parentElement;
  }
  return workspace;
}

/**
 * Register-style windowing for ListCard / in-flow tables. Do not use on Register.
 * Live node when that node is the Y scroller; otherwise workspace so first paint
 * is not empty. Measure only when count / size / scroller change — never on virt
 * identity (that loops). getItemKey and estimateSize are read from refs so
 * parent identity changes do not rebuild the range.
 */
export function useListVirtualizer(
  count: number,
  scrollRef: RefObject<HTMLElement | null>,
  getItemKey: (index: number) => string | number,
  estimateSize?: number,
  enabled = true,
) {
  const { isCompact, density } = useListDensity();
  const resolvedSize = estimateSize ?? listRowEstimateSize(isCompact);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const keyRef = useRef(getItemKey);
  keyRef.current = getItemKey;
  const sizeRef = useRef(resolvedSize);
  sizeRef.current = resolvedSize;
  useLayoutEffect(() => {
    const node = scrollRef.current;
    setScrollEl((prev) => (prev === node ? prev : node));
  });
  const virt = useVirtualizer({
    count,
    enabled,
    getScrollElement: () => resolveScrollParent(scrollEl ?? scrollRef.current),
    estimateSize: () => sizeRef.current,
    overscan: 12,
    getItemKey: (index) => keyRef.current(index),
  });
  useEffect(() => {
    if (!enabled) return;
    virt.measure();
    // Layout / count / size / density / scroller — virt identity would remeasure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, resolvedSize, density, scrollEl, enabled]);
  const items = virt.getVirtualItems();
  const first = items[0];
  const last = items[items.length - 1];
  return {
    items,
    padTop: first ? first.start : 0,
    padBottom: last ? Math.max(0, virt.getTotalSize() - last.end) : 0,
  };
}

export function VirtPad({ height, colSpan }: { height: number; colSpan: number }) {
  if (height <= 0) return null;
  return (
    <tr aria-hidden>
      <td colSpan={colSpan} style={{ height, padding: 0, border: 0 }} />
    </tr>
  );
}

/** Match CSS 0.65rem gap without rewriting Register virt (that one stays 8). */
export const CARD_VIRT_GAP = 10;

export function cardLaneCount(width: number, compact?: boolean): number {
  if (compact) return 1;
  if (typeof window !== "undefined" && window.innerWidth < 768) return 1;
  if (width >= 56 * 16) return 3;
  if (width >= 36 * 16) return 2;
  return 1;
}

/** Desk DocCards 2-col at 36rem / 3-col at 56rem; phone and compact (party split) stay 1-col. */
export function useCardLanes(compact?: boolean): number {
  const [lanes, setLanes] = useState(() =>
    cardLaneCount(typeof window !== "undefined" ? window.innerWidth : 390, compact),
  );
  useLayoutEffect(() => {
    const read = () => {
      if (compact) {
        setLanes(1);
        return;
      }
      const ws = getWorkspaceScrollElement();
      const w = ws?.clientWidth ?? (typeof window !== "undefined" ? window.innerWidth : 390);
      setLanes(cardLaneCount(w, false));
    };
    read();
    const ws = getWorkspaceScrollElement();
    const ro = typeof ResizeObserver !== "undefined" && ws ? new ResizeObserver(read) : null;
    if (ws) ro?.observe(ws);
    window.addEventListener("resize", read);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [compact]);
  return compact ? 1 : lanes;
}

/**
 * Window Grid cards against the workspace (or a capped scroller).
 * Register / Reconcile keep their own virt — do not use this there.
 */
export function useCardVirtualizer(
  count: number,
  scrollRef: RefObject<HTMLElement | null>,
  getItemKey: (index: number) => string | number,
  estimateSize?: number,
  lanes = 1,
  enabled = true,
) {
  const { isCompact, density } = useListDensity();
  const resolvedSize = estimateSize ?? cardEstimateSize(isCompact);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const keyRef = useRef(getItemKey);
  keyRef.current = getItemKey;
  const sizeRef = useRef(resolvedSize);
  sizeRef.current = resolvedSize;
  useLayoutEffect(() => {
    const node = scrollRef.current;
    setScrollEl((prev) => (prev === node ? prev : node));
    const scroller = resolveScrollParent(node);
    setScrollMargin(listScrollMargin(node, scroller));
  });
  const laneCount = Math.max(1, lanes);
  const virt = useVirtualizer({
    count,
    enabled,
    getScrollElement: () => resolveScrollParent(scrollEl ?? scrollRef.current),
    estimateSize: () => sizeRef.current,
    overscan: 8,
    lanes: laneCount,
    gap: CARD_VIRT_GAP,
    getItemKey: (index) => keyRef.current(index),
    scrollMargin,
  });
  useEffect(() => {
    if (!enabled) return;
    virt.measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, resolvedSize, density, scrollEl, enabled, laneCount]);
  return {
    items: virt.getVirtualItems(),
    totalSize: virt.getTotalSize(),
    scrollMargin,
    gap: CARD_VIRT_GAP,
    measureElement: virt.measureElement,
  };
}
