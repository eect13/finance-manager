import { useSyncExternalStore } from "react";

const KEY = "finance-manager-ui-zoom";
const CSS_VAR = "--app-ui-zoom";
export const UI_ZOOM_MIN = 0.75;
export const UI_ZOOM_MAX = 1.5;
export const UI_ZOOM_STEP = 0.05;
export const UI_ZOOM_DEFAULT = 1;

const listeners = new Set<() => void>();

function clampZoom(n: number): number {
  const stepped = Math.round(n / UI_ZOOM_STEP) * UI_ZOOM_STEP;
  return Math.min(UI_ZOOM_MAX, Math.max(UI_ZOOM_MIN, Number(stepped.toFixed(2))));
}

export function parseUiZoom(raw: string | null): number {
  if (raw == null || raw === "") return UI_ZOOM_DEFAULT;
  const n = Number(raw);
  if (!Number.isFinite(n)) return UI_ZOOM_DEFAULT;
  return clampZoom(n);
}

export function readUiZoom(): number {
  if (typeof localStorage === "undefined") return UI_ZOOM_DEFAULT;
  try {
    return parseUiZoom(localStorage.getItem(KEY));
  } catch {
    return UI_ZOOM_DEFAULT;
  }
}

export function applyUiZoom(value: number) {
  if (typeof document === "undefined") return;
  const z = clampZoom(value);
  document.documentElement.style.setProperty(CSS_VAR, String(z));
}

export function writeUiZoom(value: number) {
  const z = clampZoom(value);
  try {
    localStorage.setItem(KEY, String(z));
  } catch {
    /* private mode */
  }
  applyUiZoom(z);
}

let current = UI_ZOOM_DEFAULT;
if (typeof window !== "undefined") {
  current = readUiZoom();
  applyUiZoom(current);
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getUiZoom(): number {
  return current;
}

export function setUiZoom(value: number) {
  current = clampZoom(value);
  writeUiZoom(current);
  emit();
}

export function nudgeUiZoom(delta: number) {
  setUiZoom(current + delta);
}

export function resetUiZoom() {
  setUiZoom(UI_ZOOM_DEFAULT);
}

export function subscribeUiZoom(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useUiZoom() {
  const zoom = useSyncExternalStore(subscribeUiZoom, getUiZoom, () => UI_ZOOM_DEFAULT);
  return {
    zoom,
    percent: Math.round(zoom * 100),
    setZoom: setUiZoom,
    zoomIn: () => nudgeUiZoom(UI_ZOOM_STEP),
    zoomOut: () => nudgeUiZoom(-UI_ZOOM_STEP),
    reset: resetUiZoom,
    canZoomIn: zoom < UI_ZOOM_MAX - 1e-9,
    canZoomOut: zoom > UI_ZOOM_MIN + 1e-9,
  };
}

/** Apply before paint — pairs with THEME_BOOT in root / desktop.html. */
export const UI_ZOOM_BOOT = `(function(){try{var k=${JSON.stringify(KEY)};var v=localStorage.getItem(k);var n=v==null||v===""?${UI_ZOOM_DEFAULT}:Number(v);if(!isFinite(n))n=${UI_ZOOM_DEFAULT};n=Math.min(${UI_ZOOM_MAX},Math.max(${UI_ZOOM_MIN},Math.round(n/${UI_ZOOM_STEP})*${UI_ZOOM_STEP}));n=Number(n.toFixed(2));document.documentElement.style.setProperty(${JSON.stringify(CSS_VAR)},String(n));}catch(e){}})();`;
