import { useCallback, useEffect, useMemo, useState } from "react";

export type ColAlign = "left" | "center" | "right";

/** Default cell content align: center for every column (⋮ menu overrides; prefs persist). */
export function defaultColAlign(_id: string): ColAlign {
  return "center";
}

export function alignClass(align: ColAlign) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

/** Body cell class + data-align so CSS/⋮ prefs actually stick. */
export function cellAlign(align?: ColAlign) {
  const a: ColAlign = align ?? "center";
  return { className: alignClass(a), "data-align": a } as const;
}

export function headerJustify(align: ColAlign) {
  if (align === "right") return "justify-end";
  if (align === "center") return "justify-center";
  return "justify-start";
}

export function useColAligns<K extends string>(storageKey: string, columnIds: readonly K[]) {
  const idKey = columnIds.join(",");
  const ids = useMemo(() => idKey.split(",") as K[], [idKey]);

  const buildDefaults = useCallback(() => {
    const next = {} as Record<K, ColAlign>;
    for (const id of ids) next[id] = defaultColAlign(id);
    return next;
  }, [ids]);

  const [aligns, setAligns] = useState<Record<K, ColAlign>>(buildDefaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        const next = buildDefaults();
        for (const id of ids) {
          const v = saved[id];
          if (v === "left" || v === "center" || v === "right") next[id] = v;
        }
        setAligns(next);
      } else {
        setAligns(buildDefaults());
      }
    } catch {
      setAligns(buildDefaults());
    }
    setHydrated(true);
  }, [storageKey, ids, buildDefaults]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(aligns));
      } catch {
        /* quota */
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [storageKey, aligns, hydrated]);

  const setAlign = useCallback((id: K, align: ColAlign) => {
    setAligns((prev) => ({ ...prev, [id]: align }));
  }, []);

  const reset = useCallback(() => setAligns(buildDefaults()), [buildDefaults]);

  return { aligns, setAlign, reset };
}
