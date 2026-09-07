import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { getWorkspaceScrollElement } from "@/lib/workspace-scroll";

/** ListCard (capped overflow-y) is the Y scroller; otherwise workspace, like Register. */
function resolveScrollParent(node: HTMLElement | null): HTMLElement | null {
  const workspace = getWorkspaceScrollElement();
  if (!node || typeof getComputedStyle === "undefined") return workspace;
  const style = getComputedStyle(node);
  const canY = style.overflowY === "auto" || style.overflowY === "scroll";
  if (!canY) return workspace;
  const capped = style.maxHeight !== "none" && style.maxHeight !== "";
  if (capped) return node;
  if (node.clientHeight > 0 && node.scrollHeight > node.clientHeight + 1) return node;
  return workspace;
}

/**
 * Register-style windowing for ListCard / in-flow tables. Do not use on Register.
 * Live node when that node is the Y scroller; otherwise workspace so first paint
 * is not empty. Measure only when count / size / scroller change — never on virt
 * identity (that loops).
 */
export function useListVirtualizer(
  count: number,
  scrollRef: RefObject<HTMLElement | null>,
  getItemKey: (index: number) => string | number,
  estimateSize = 48,
  enabled = true,
) {
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const node = scrollRef.current;
    setScrollEl((prev) => (prev === node ? prev : node));
  });
  const virt = useVirtualizer({
    count,
    enabled,
    getScrollElement: () => resolveScrollParent(scrollEl ?? scrollRef.current),
    estimateSize: () => estimateSize,
    overscan: 12,
    getItemKey,
  });
  useEffect(() => {
    if (!enabled) return;
    virt.measure();
    // Layout / count / scroller only — virt identity would remeasure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, estimateSize, scrollEl, enabled]);
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
