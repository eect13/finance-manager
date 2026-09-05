import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark";

const KEY = "finance-manager-theme";
const listeners = new Set<() => void>();

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function isMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function readTheme(): ThemeMode {
  if (typeof localStorage === "undefined") return "light";
  const stored = localStorage.getItem(KEY);
  if (isMode(stored)) return stored;
  const mode: ThemeMode = prefersDark() ? "dark" : "light";
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode */
  }
  return mode;
}

export function resolvedTheme(mode: ThemeMode): "light" | "dark" {
  return mode;
}

function applyFavicon(dark: boolean) {
  if (typeof document === "undefined") return;
  const href = dark ? "/favicon-dark.svg" : "/favicon.svg";
  const links = document.querySelectorAll('link[rel="icon"][type="image/svg+xml"]');
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = href;
    document.head.appendChild(link);
    return;
  }
  links.forEach((node) => {
    (node as HTMLLinkElement).href = href;
  });
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const dark = mode === "dark";
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#141311" : "#243542");
  applyFavicon(dark);
}

export function writeTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode */
  }
  applyTheme(mode);
}

let current: ThemeMode = "light";
if (typeof window !== "undefined") {
  current = readTheme();
  applyTheme(current);
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function getTheme(): ThemeMode {
  return current;
}

export function setTheme(mode: ThemeMode) {
  current = mode;
  writeTheme(mode);
  emit();
}

export function subscribeTheme(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light" as const);
  return { theme, resolved: theme, setTheme };
}

export const THEME_BOOT = `(function(){try{var k=${JSON.stringify(KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";try{localStorage.setItem(k,t)}catch(e){}}var d=t==="dark";var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";try{var ua=navigator.userAgent||"";var tauri=!!(window.__TAURI_INTERNALS__||window.__TAURI__||ua.indexOf("Tauri")>=0);var android=/Android/i.test(ua);if(tauri&&android)r.classList.add("tauri-android");}catch(e2){}var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?"#141311":"#243542");document.querySelectorAll('link[rel="icon"][type="image/svg+xml"]').forEach(function(n){n.setAttribute("href",d?"/favicon-dark.svg":"/favicon.svg")});}catch(e){}})();`;
