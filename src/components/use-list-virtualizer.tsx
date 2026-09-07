import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { getWorkspaceScrollElement } from "@/lib/workspace-scroll";

/** Desk/phone doc lists scroll inside ListCard. Do not use on Register. */
export function useListVirtualizer(
  count: number,
  scrollRef: RefObject<HTMLElement | null>,
  getItemKey: (index: number) => string | number,
  estimateSize = 48,
) {
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const node = scrollRef.current;
    setScrollEl((prev) => (prev === node ? prev : node));
  });
  const virt = useVirtualizer({
    count,
    getScrollElement: () => scrollEl ?? scrollRef.current ?? getWorkspaceScrollElement(),
    estimateSize: () => estimateSize,
    overscan: 8,
    getItemKey,
  });
  useEffect(() => {
    virt.measure();
  }, [count, estimateSize, scrollEl, virt]);
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
