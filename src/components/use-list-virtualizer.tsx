import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, type RefObject } from "react";

/** Desk/phone doc lists scroll inside ListCard. Do not use on Register. */
export function useListVirtualizer(
  count: number,
  scrollRef: RefObject<HTMLElement | null>,
  getItemKey: (index: number) => string | number,
  estimateSize = 48,
) {
  const virt = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan: 16,
    getItemKey,
  });
  useEffect(() => {
    virt.measure();
  }, [count, virt]);
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
