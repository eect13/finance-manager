import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AUDIT_MAX_EVENTS, capAuditEvents, contentFingerprint } from "./audit-cap.ts";
import type { AuditEvent } from "./types.ts";

function ev(i: number): AuditEvent {
  return { id: `a${i}`, at: i, who: "this browser", action: "recon", detail: `n${i}`, old: "", new: "" };
}

describe("audit cap / fingerprint", () => {
  it("keeps the newest events within the count budget", () => {
    const many = Array.from({ length: AUDIT_MAX_EVENTS + 50 }, (_, i) => ev(i));
    const capped = capAuditEvents(many);
    assert.equal(capped.length, AUDIT_MAX_EVENTS);
    assert.equal(capped[0]!.id, `a${50}`);
    assert.equal(capped.at(-1)!.id, `a${AUDIT_MAX_EVENTS + 49}`);
  });

  it("fingerprints identical JSON the same way", () => {
    const a = contentFingerprint({ x: 1, y: [2, 3] });
    const b = contentFingerprint({ x: 1, y: [2, 3] });
    const c = contentFingerprint({ x: 1, y: [2, 4] });
    assert.equal(a, b);
    assert.notEqual(a, c);
  });
});
