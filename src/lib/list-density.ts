import { useSyncExternalStore } from "react";

const KEY = "finance-manager-list-density";
const ATTR = "data-list-density";

export type ListDensity = "comfortable" | "compact";
export const LIST_DENSITY_DEFAULT: ListDensity = "comfortable";

const listeners = new Set<() => void>();

function clearStoredDensity() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

/** Compact localStorage is ignored — Options no longer exposes density. */
export function parseListDensity(_raw: string | null): ListDensity {
  return LIST_DENSITY_DEFAULT;
}

export function readListDensity(): ListDensity {
  clearStoredDensity();
  return LIST_DENSITY_DEFAULT;
}

export function applyListDensity(value: ListDensity) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(ATTR, value);
}

export function writeListDensity(_value: ListDensity) {
  clearStoredDensity();
  applyListDensity(LIST_DENSITY_DEFAULT);
}

let current: ListDensity = LIST_DENSITY_DEFAULT;
if (typeof window !== "undefined") {
  current = LIST_DENSITY_DEFAULT;
  clearStoredDensity();
  applyListDensity(current);
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getListDensity(): ListDensity {
  return current;
}

export function setListDensity(_value: ListDensity) {
  current = LIST_DENSITY_DEFAULT;
  writeListDensity(current);
  emit();
}

export function subscribeListDensity(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useListDensity() {
  const density = useSyncExternalStore(subscribeListDensity, getListDensity, () => LIST_DENSITY_DEFAULT);
  return {
    density,
    setDensity: setListDensity,
    isCompact: density === "compact",
  };
}

/** Apply Comfortable before paint and drop a leftover Compact key. */
export const LIST_DENSITY_BOOT = `(function(){try{var k=${JSON.stringify(KEY)};try{localStorage.removeItem(k);}catch(e){}document.documentElement.setAttribute(${JSON.stringify(ATTR)},${JSON.stringify(LIST_DENSITY_DEFAULT)});}catch(e){}})();`;
