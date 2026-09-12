import type { AuditEvent } from "./types";

/** Newest-first retention for the in-file audit trail (production ledger style). */
export const AUDIT_MAX_EVENTS = 800;
/** Approximate JSON character budget for the audit array (~180 KB). */
export const AUDIT_MAX_CHARS = 180_000;

/**
 * Keep the newest events within count and size budgets. Drops oldest first.
 * Safe to run on every append and on normalize/load.
 */
export function capAuditEvents(events: AuditEvent[] | undefined | null): AuditEvent[] {
  const raw = Array.isArray(events) ? events : [];
  let list = raw.length > AUDIT_MAX_EVENTS ? raw.slice(-AUDIT_MAX_EVENTS) : raw.slice();
  while (list.length > 40) {
    let size = 0;
    try {
      size = JSON.stringify(list).length;
    } catch {
      break;
    }
    if (size <= AUDIT_MAX_CHARS) break;
    const drop = Math.max(1, Math.ceil(list.length * 0.12));
    list = list.slice(drop);
  }
  return list;
}

/** Cheap stable fingerprint for skip-identical IDB writes (not cryptographic). */
export function contentFingerprint(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${text.length.toString(36)}:${(h >>> 0).toString(36)}`;
}
