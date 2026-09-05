import { useSyncExternalStore } from "react";

const KEY = "finance-manager-list-density";
const ATTR = "data-list-density";

export type ListDensity = "comfortable" | "compact";
export const LIST_DENSITY_DEFAULT: ListDensity = "comfortable";

const listeners = new Set<() => void>();

export function parseListDensity(raw: string | null): ListDensity {
  return raw === "compact" ? "compact" : "comfortable";
}

export function readListDensity(): ListDensity {
  if (typeof localStorage === "undefined") return LIST_DENSITY_DEFAULT;
  try {
    return parseListDensity(localStorage.getItem(KEY));
  } catch {
    return LIST_DENSITY_DEFAULT;
  }
}

export function applyListDensity(value: ListDensity) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(ATTR, value);
}

export function writeListDensity(value: ListDensity) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* private mode */
  }
  applyListDensity(value);
}

let current: ListDensity = LIST_DENSITY_DEFAULT;
if (typeof window !== "undefined") {
  current = readListDensity();
  applyListDensity(current);
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getListDensity(): ListDensity {
  return current;
}

export function setListDensity(value: ListDensity) {
  current = value === "compact" ? "compact" : "comfortable";
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

/** Apply before paint — pairs with THEME_BOOT / UI_ZOOM_BOOT. */
export const LIST_DENSITY_BOOT = `(function(){try{var k=${JSON.stringify(KEY)};var v=localStorage.getItem(k);var d=v==="compact"?"compact":"comfortable";document.documentElement.setAttribute(${JSON.stringify(ATTR)},d);}catch(e){}})();`;
