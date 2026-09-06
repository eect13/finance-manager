import { useCallback, useEffect, useState } from "react";
import { FIT_VERSION } from "@/lib/finance/col-fit-mark";
import { ACTIONS_COL_MIN } from "@/lib/finance/fit-column";

export function clampCol(n: number, min = 56, max = 420) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function loadColWidths<K extends string>(
  storageKey: string,
  defaults: Record<K, number>,
  min: number,
  max: number,
): Record<K, number> {
  const next = { ...defaults };
  if (typeof window === "undefined") return next;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return next;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    if (saved._fit !== FIT_VERSION) return next;
    for (const key of Object.keys(defaults) as K[]) {
      const value = saved[key];
      if (typeof value === "number" && Number.isFinite(value)) next[key] = clampCol(value, min, max);
    }
  } catch {
    /* keep defaults */
  }
  return next;
}

export function useColWidths<K extends string>(
  storageKey: string,
  defaults: Record<K, number>,
  opts?: { min?: number; max?: number },
) {
  const min = opts?.min ?? 56;
  const max = opts?.max ?? 420;
  const [widths, setWidths] = useState<Record<K, number>>(() => loadColWidths(storageKey, defaults, min, max));

  const tableRef = useCallback((_node: HTMLTableElement | null) => {
    /* Callers still pass ref={cols.tableRef}; widths are stored px, not measured on mount. */
  }, []);

  useEffect(() => {
    setWidths(loadColWidths(storageKey, defaults, min, max));
    // Reload when the storage key changes (party dir customer vs vendor).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, min, max]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ ...widths, _fit: FIT_VERSION }));
      } catch {
        /* quota */
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [storageKey, widths]);

  const setWidth = useCallback(
    (id: K, next: number) => {
      const role = id === "actions" ? "actions" : undefined;
      const floor = role === "actions" ? Math.max(min, ACTIONS_COL_MIN) : min;
      const ceil = role === "actions" ? Math.min(max, 320) : max;
      setWidths((prev) => ({ ...prev, [id]: clampCol(next, floor, ceil) }));
    },
    [min, max],
  );

  const tableWidth = (Object.keys(defaults) as K[]).reduce((sum, key) => sum + (widths[key] ?? defaults[key]), 0);

  return { widths, setWidth, tableWidth, tableRef };
}
