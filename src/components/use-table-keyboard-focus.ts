import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type Ref } from "react";

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(
    el?.closest(
      "input, textarea, select, [contenteditable='true'], [role='dialog'], [data-radix-select-content], [data-radix-popper-content-wrapper], [data-party-list]",
    ),
  );
}

function isInteractive(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, button, a, [role='checkbox'], [role='menuitem'], [data-radix-select-trigger]"));
}

export type TableKeyboardFocusOptions = {
  ids: string[];
  onOpen?: (id: string) => void;
  /** Space toggles tick/select when provided (Register). */
  onToggle?: (id: string) => void;
  onActive?: (id: string) => void;
  enabled?: boolean;
};

/**
 * QuickBooks-like list focus: click the table (tabIndex=0), then Up/Down moves a
 * focused row separate from multi-select checkboxes. Enter opens; Space toggles when wired.
 */
export function useTableKeyboardFocus({
  ids,
  onOpen,
  onToggle,
  onActive,
  enabled = true,
}: TableKeyboardFocusOptions) {
  const [focusedId, setFocusedIdState] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const focusedRef = useRef<string | null>(null);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  focusedRef.current = focusedId;

  const setFocusedId = useCallback(
    (id: string | null) => {
      focusedRef.current = id;
      setFocusedIdState(id);
      if (id) onActive?.(id);
    },
    [onActive],
  );

  useEffect(() => {
    if (focusedId && ids.includes(focusedId)) return;
    setFocusedIdState(ids[0] ?? null);
  }, [ids, focusedId]);

  const focusContainer = useCallback(() => {
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  const move = useCallback(
    (delta: number) => {
      const list = idsRef.current;
      if (list.length === 0) return;
      const idx = Math.max(0, list.indexOf(focusedRef.current ?? ""));
      const next = list[Math.min(list.length - 1, Math.max(0, idx + delta))];
      if (!next) return;
      setFocusedId(next);
      const root = containerRef.current;
      const byId = root?.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(next)}"]`);
      byId?.scrollIntoView({ block: "nearest" });
    },
    [setFocusedId],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent | KeyboardEvent) => {
      if (!enabled) return;
      if (isTypingTarget(e.target)) return;
      const root = containerRef.current;
      if (!root) return;
      const active = document.activeElement;
      if (active && active !== root && !root.contains(active)) return;
      // Allow when container itself focused, or focus is inside (e.g. row tabIndex).
      if (active !== root && active instanceof HTMLElement && isTypingTarget(active)) return;

      const list = idsRef.current;
      if (list.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        move(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        move(-1);
        return;
      }
      const cur = focusedRef.current;
      const id = cur && list.includes(cur) ? cur : list[0];
      if (!id) return;
      if (e.key === "Enter") {
        e.preventDefault();
        onOpen?.(id);
        return;
      }
      if (e.key === " " || e.key === "Spacebar") {
        if (onToggle) {
          e.preventDefault();
          onToggle(id);
        }
      }
    },
    [enabled, focusedId, move, onOpen, onToggle],
  );

  // Window capture so arrows work after click-focus even if a child stole focus briefly.
  useEffect(() => {
    if (!enabled) return;
    function onWinKey(e: KeyboardEvent) {
      const root = containerRef.current;
      if (!root) return;
      const active = document.activeElement;
      if (!active || (active !== root && !root.contains(active))) return;
      onKeyDown(e);
    }
    window.addEventListener("keydown", onWinKey);
    return () => window.removeEventListener("keydown", onWinKey);
  }, [enabled, onKeyDown]);

  const onMouseDown = useCallback((e: ReactMouseEvent) => {
    if (isInteractive(e.target)) return;
    focusContainer();
  }, [focusContainer]);

  const setContainerRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  /** Merge with an existing ref (e.g. gridRef for column fit). */
  const bindContainer = useCallback(
    <T extends HTMLElement>(outer?: Ref<T> | null) => {
      return (node: T | null) => {
        containerRef.current = node;
        if (!outer) return;
        if (typeof outer === "function") outer(node);
        else (outer as { current: T | null }).current = node;
      };
    },
    [],
  );

  const containerProps = {
    ref: setContainerRef,
    tabIndex: 0 as const,
    onMouseDown,
  };

  const rowProps = useCallback(
    (id: string) => ({
      "data-row-id": id,
      "data-focused": focusedId === id ? ("true" as const) : undefined,
      "aria-current": focusedId === id ? ("true" as const) : undefined,
      onClick: () => setFocusedId(id),
    }),
    [focusedId, setFocusedId],
  );

  return {
    focusedId,
    setFocusedId,
    /** @deprecated use focusedId — alias for older call sites */
    activeId: focusedId,
    setActiveId: setFocusedId,
    containerProps,
    bindContainer,
    setContainerRef,
    rowProps,
    isFocused: (id: string) => focusedId === id,
    focusContainer,
  };
}

/** Back-compat wrapper used by Checks/Bills/… — now focus-scoped when container is bound. */
export function useListPointer(
  ids: string[],
  onOpen: (id: string) => void,
  _scope?: string,
  onActive?: (id: string) => void,
) {
  return useTableKeyboardFocus({ ids, onOpen, onActive });
}
