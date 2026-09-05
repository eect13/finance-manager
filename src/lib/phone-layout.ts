import { useEffect, useState } from "react";

export type PhoneLayout = "grid" | "list";

export function readPhoneLayout(key: string, fallback: PhoneLayout = "grid"): PhoneLayout {
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
  const [phone, setPhone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px), ((hover: none) and (pointer: coarse))").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), ((hover: none) and (pointer: coarse))");
    const apply = () => setPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return phone;
}
