import { useEffect, useState } from "react";

export type PhoneLayout = "grid" | "list";

const PHONE_UI_MQ = "(max-width: 767px), ((hover: none) and (pointer: coarse))";
const NARROW_UI_MQ = "(max-width: 767px)";

function useMedia(query: string, initial: () => boolean) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setOn(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [query]);
  return on;
}

/** Phone chrome (⋯, bottom sheets). Includes hybrid coarse laptops. */
export function isPhoneUi() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(PHONE_UI_MQ).matches;
}

/** Narrow viewport only — desk List at 768px+ even on a touch laptop. */
export function isNarrowUi() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(NARROW_UI_MQ).matches;
}

/** Grid under 768px; List on desk. Saved localStorage wins over this. */
export function defaultListLayout(): PhoneLayout {
  return isNarrowUi() ? "grid" : "list";
}

export function readPhoneLayout(key: string, fallback: PhoneLayout = defaultListLayout()): PhoneLayout {
  try {
    const v = localStorage.getItem(key);
    if (v === "grid" || v === "list") return v;
  } catch {
    /* private mode */
  }
  return fallback;
}

export function writePhoneLayout(key: string, layout: PhoneLayout) {
  try {
    localStorage.setItem(key, layout);
  } catch {
    /* private mode */
  }
}

/** Shared desk+phone Register Grid|List preference. */
export const REGISTER_PHONE_LAYOUT_KEY = "finance-manager-register-phone-layout";
export const RECONCILE_PHONE_LAYOUT_KEY = "finance-manager-reconcile-phone-layout";

export function usePhoneUi() {
  return useMedia(PHONE_UI_MQ, isPhoneUi);
}

export function useNarrowUi() {
  return useMedia(NARROW_UI_MQ, isNarrowUi);
}
