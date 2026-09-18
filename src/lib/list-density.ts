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

export function applyListDensity(value: ListDensity) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(ATTR, value);
}

function writeListDensity() {
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

/** Options density removed — always Comfortable; ignores Compact leftovers. */
export function setListDensity(_value?: ListDensity) {
  current = LIST_DENSITY_DEFAULT;
  writeListDensity();
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

/** Apply Comfortable before paint and drop a leftover Compact localStorage key. */
export const LIST_DENSITY_BOOT = `(function(){try{var k=${JSON.stringify(KEY)};try{localStorage.removeItem(k);}catch(e){}document.documentElement.setAttribute(${JSON.stringify(ATTR)},${JSON.stringify(LIST_DENSITY_DEFAULT)});}catch(e){}})();`;
