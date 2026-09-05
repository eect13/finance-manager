import { useCallback, useEffect, useRef, useState } from "react";
import { autoFitTable, widthsMatch } from "@/lib/finance/fit-column";

const FIT_MARK = "finance-manager-colfit";
const FIT_VERSION = "content-6";

export function clampCol(n: number, min = 56, max = 420) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function useColWidths<K extends string>(
  storageKey: string,
  defaults: Record<K, number>,
  opts?: { min?: number; max?: number },
) {
  const min = opts?.min ?? 56;
  const max = opts?.max ?? 420;
  const [widths, setWidths] = useState<Record<K, number>>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const virginRef = useRef(true);
  const fittedRef = useRef(false);
  const [tableEl, setTableEl] = useState<HTMLTableElement | null>(null);

  const tableRef = useCallback((node: HTMLTableElement | null) => {
    setTableEl(node);
  }, []);

  useEffect(() => {
    let forceContent = true;
    try {
      forceContent = localStorage.getItem(FIT_MARK) !== FIT_VERSION;
      if (forceContent) localStorage.setItem(FIT_MARK, FIT_VERSION);
    } catch {
      /* stay true — re-fit */
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw && !forceContent) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        const next = { ...defaults };
        for (const key of Object.keys(defaults) as K[]) {
          const value = saved[key];
          if (typeof value === "number" && Number.isFinite(value)) next[key] = clampCol(value, min, max);
        }
        setWidths(next);
        virginRef.current = widthsMatch(next, defaults);
      } else {
        virginRef.current = true;
      }
    } catch {
      virginRef.current = true;
    }
    setHydrated(true);
    // Hydrate once per key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(widths));
      } catch {
        /* quota */
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [storageKey, widths, hydrated]);

  useEffect(() => {
    if (!hydrated || !virginRef.current || fittedRef.current || !tableEl) return;
    const ids = Object.keys(defaults) as K[];

    function tryFit() {
      if (fittedRef.current || !tableEl) return false;
      const hasCells = ids.some((id) => tableEl.querySelector(`td[data-col="${id}"], td.col-${id}`));
      if (!hasCells) return false;
      const fitted = autoFitTable(tableEl, ids, { min, max });
      fittedRef.current = true;
      virginRef.current = false;
      setWidths((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          const value = fitted[id];
          if (typeof value === "number") next[id] = value;
        }
        return next;
      });
      return true;
    }

    if (tryFit()) return;
    const mo = new MutationObserver(() => {
      if (tryFit()) mo.disconnect();
    });
    mo.observe(tableEl, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [hydrated, tableEl, defaults, min, max]);

  const setWidth = useCallback(
    (id: K, next: number) => {
      virginRef.current = false;
      setWidths((prev) => ({ ...prev, [id]: clampCol(next, min, max) }));
    },
    [min, max],
  );

  const tableWidth = (Object.keys(defaults) as K[]).reduce((sum, key) => sum + widths[key], 0);

  return { widths, setWidth, tableWidth, tableRef };
}
