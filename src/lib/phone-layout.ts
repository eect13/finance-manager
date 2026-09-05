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

export const REGISTER_PHONE_LAYOUT_KEY = "finance-manager-register-phone-layout";
export const RECONCILE_PHONE_LAYOUT_KEY = "finance-manager-reconcile-phone-layout";
