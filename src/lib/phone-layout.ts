import { useEffect, useState } from "react";

export type PhoneLayout = "grid" | "list";

const PHONE_UI_MQ = "(max-width: 767px), ((hover: none) and (pointer: coarse))";

/** Sync phone/coarse check (col defaults, one-shot layout). Prefer usePhoneUi in React trees. */
export function isPhoneUi() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(PHONE_UI_MQ).matches;
}

/** Grid on phone / coarse; List on desk. Saved localStorage wins over this. */
export function defaultListLayout(): PhoneLayout {
  return isPhoneUi() ? "grid" : "list";
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
  const [phone, setPhone] = useState(() => isPhoneUi());
  useEffect(() => {
    const mq = window.matchMedia(PHONE_UI_MQ);
    const apply = () => setPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return phone;
}
