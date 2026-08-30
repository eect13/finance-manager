import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export interface EntrySort<T> {
  sorted: T[];
  key: string;
  dir: SortDir;
  toggle: (column: string) => void;
  set: (column: string, dir?: SortDir) => void;
}

export function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function sortEntries<T>(
  items: T[],
  key: string,
  dir: SortDir,
  getters: Record<string, (item: T) => string | number>,
): T[] {
  const get = getters[key];
  if (!get) return items;
  const copy = [...items];
  copy.sort((a, b) => {
    const cmp = compareValues(get(a), get(b));
    return dir === "asc" ? cmp : -cmp;
  });
  return copy;
}

export function useEntrySort<T>(
  items: T[],
  defaultKey: string,
  getters: Record<string, (item: T) => string | number>,
  defaultDir: SortDir = "asc",
): EntrySort<T> {
  const [key, setKey] = useState(defaultKey);
  const [dir, setDir] = useState<SortDir>(defaultDir);

  function toggle(column: string) {
    if (key === column) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setKey(column);
      setDir(column === "order" || column === "date" || column === "name" ? "asc" : defaultDir);
    }
  }

  function set(column: string, nextDir?: SortDir) {
    setKey(column);
    setDir(nextDir ?? (column === "order" || column === "date" || column === "name" ? "asc" : defaultDir));
  }

  const sorted = useMemo(() => sortEntries(items, key, dir, getters), [items, key, dir, getters]);
  return { sorted, key, dir, toggle, set };
}

export function moveId(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return ids;
  const from = ids.indexOf(fromId);
  if (from < 0) return ids;
  const next = ids.filter((id) => id !== fromId);
  const to = next.indexOf(toId);
  if (to < 0) return ids;
  next.splice(to, 0, fromId);
  return next;
}

export function reorderList<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
