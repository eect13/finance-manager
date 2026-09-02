import { useEffect, useState } from "react";

export function useListPointer(ids: string[], onOpen: (id: string) => void, scope?: string, onActive?: (id: string) => void) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (activeId && ids.includes(activeId)) return;
    setActiveId(ids[0] ?? null);
  }, [ids, activeId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog'], [data-radix-select-content], [data-party-list]")) {
        return;
      }
      if (scope) {
        if (!target?.closest(scope)) return;
      } else if (target?.closest("[role='listbox']")) {
        return;
      }
      if (ids.length === 0) return;
      const index = Math.max(0, ids.indexOf(activeId ?? ""));
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = ids[Math.min(ids.length - 1, index + 1)];
        if (next) {
          setActiveId(next);
          onActive?.(next);
        }
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = ids[Math.max(0, index - 1)];
        if (next) {
          setActiveId(next);
          onActive?.(next);
        }
        return;
      }
      if (e.key === "Enter" && activeId) {
        e.preventDefault();
        onOpen(activeId);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ids, activeId, onOpen, scope, onActive]);

  return { activeId, setActiveId };
}
