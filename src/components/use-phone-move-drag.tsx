import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { dropPlaceFromPoint, type ArrangePlace } from "@/lib/finance/register";
import { autoScrollWorkspaceAt } from "@/lib/workspace-scroll";

const THRESHOLD_PX = 10;

type OverTarget =
  | { kind: "row"; id: string; date: string; place: ArrangePlace }
  | null;

type Session = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
  label: string;
  target: HTMLElement;
  dispose: () => void;
};

export type PhoneMoveDrop = {
  lineId: string;
  targetId: string;
  date: string;
  place: ArrangePlace;
};

export type PhoneMoveDragApi = {
  /** Attach to a reschedulable grip (caller toasts locked separately). */
  onGripPointerDown: (lineId: string, e: ReactPointerEvent) => void;
  clear: () => void;
  ghost: ReactNode;
};

/**
 * Pointer-based Move / passbook arrange (desk + phone; Android WebView-safe).
 * Grip → ghost → hit-test row drop zones (before/after insert).
 * Prefer over HTML5 tr draggable — table-row DnD is flaky on desktop.
 */
export function usePhoneMoveDrag({
  enabled,
  onDragId,
  onOverRow,
  onOverPlace,
  onDrop,
  captionFor,
  onTapWithoutDrag,
}: {
  enabled: boolean;
  onDragId: (id: string | null) => void;
  onOverRow: (id: string | null) => void;
  onOverPlace: (place: ArrangePlace | null) => void;
  onDrop: (drop: PhoneMoveDrop) => void;
  captionFor: (id: string) => string;
  onTapWithoutDrag?: () => void;
}): PhoneMoveDragApi {
  const [ghost, setGhost] = useState<{ x: number; y: number; label: string } | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const lastOverRef = useRef<OverTarget>(null);
  const rafRef = useRef(0);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
  const cbs = useRef({ onDragId, onOverRow, onOverPlace, onDrop, captionFor, onTapWithoutDrag });
  cbs.current = { onDragId, onOverRow, onOverPlace, onDrop, captionFor, onTapWithoutDrag };

  const applyOver = useCallback((over: OverTarget) => {
    const prev = lastOverRef.current;
    const same =
      prev === over ||
      (prev !== null &&
        over !== null &&
        prev.kind === over.kind &&
        prev.id === over.id &&
        prev.place === over.place);
    if (same) return;
    lastOverRef.current = over;
    cbs.current.onOverRow(over?.kind === "row" ? over.id : null);
    cbs.current.onOverPlace(over?.kind === "row" ? over.place : null);
  }, []);

  const clearVisual = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    pendingPointRef.current = null;
    lastOverRef.current = null;
    setGhost(null);
    cbs.current.onDragId(null);
    cbs.current.onOverRow(null);
    cbs.current.onOverPlace(null);
    document.body.classList.remove("is-phone-move-dragging");
  }, []);

  const clear = useCallback(() => {
    const s = sessionRef.current;
    sessionRef.current = null;
    if (s) {
      s.dispose();
      try {
        s.target.releasePointerCapture(s.pointerId);
      } catch {
        /* already released */
      }
    }
    clearVisual();
  }, [clearVisual]);

  useEffect(() => {
    if (!enabled) clear();
  }, [enabled, clear]);

  useEffect(() => () => clear(), [clear]);

  const onGripPointerDown = useCallback(
    (lineId: string, e: ReactPointerEvent) => {
      if (!enabled) return;
      if (e.button !== 0) return;
      if (sessionRef.current) clear();

      e.stopPropagation();
      e.preventDefault();

      const target = e.currentTarget as HTMLElement;
      const label = cbs.current.captionFor(lineId);

      const hitTest = (x: number, y: number): OverTarget => {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        if (!el) return null;
        const rowEl = el.closest("[data-move-row]") as HTMLElement | null;
        const rowId = rowEl?.dataset.moveRow;
        const rowDate = rowEl?.dataset.moveRowDate;
        if (rowId && rowDate && rowId !== lineId) {
          const rect = rowEl!.getBoundingClientRect();
          const place = dropPlaceFromPoint(y, rect.top, rect.height);
          return { kind: "row", id: rowId, date: rowDate, place };
        }
        return null;
      };

      const flushFrame = () => {
        rafRef.current = 0;
        const s = sessionRef.current;
        const pt = pendingPointRef.current;
        if (!s?.active || !pt) return;
        setGhost({ x: pt.x, y: pt.y, label: s.label });
        // Edge auto-scroll so far-date drops work without scroll-then-re-drag.
        const scrolled = autoScrollWorkspaceAt(pt.y);
        applyOver(hitTest(pt.x, pt.y));
        if (scrolled && sessionRef.current?.active && pendingPointRef.current) {
          rafRef.current = requestAnimationFrame(flushFrame);
        }
      };

      const onMove = (ev: PointerEvent) => {
        const s = sessionRef.current;
        if (!s || ev.pointerId !== s.pointerId) return;
        const dx = ev.clientX - s.startX;
        const dy = ev.clientY - s.startY;
        if (!s.active) {
          if (Math.hypot(dx, dy) < THRESHOLD_PX) return;
          s.active = true;
          cbs.current.onDragId(s.id);
          document.body.classList.add("is-phone-move-dragging");
        }
        ev.preventDefault();
        pendingPointRef.current = { x: ev.clientX, y: ev.clientY };
        if (!rafRef.current) rafRef.current = requestAnimationFrame(flushFrame);
      };

      const onUp = (ev: PointerEvent) => {
        const s = sessionRef.current;
        if (!s || ev.pointerId !== s.pointerId) return;
        s.dispose();
        try {
          target.releasePointerCapture(ev.pointerId);
        } catch {
          /* ok */
        }
        sessionRef.current = null;

        if (!s.active) {
          clearVisual();
          cbs.current.onTapWithoutDrag?.();
          return;
        }

        const over = hitTest(ev.clientX, ev.clientY);
        clearVisual();
        if (over?.kind === "row") {
          cbs.current.onDrop({
            lineId: s.id,
            targetId: over.id,
            date: over.date,
            place: over.place,
          });
        } else {
          toast.message("Drop above or below another row.");
        }
      };

      const dispose = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
      };

      sessionRef.current = {
        id: lineId,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        label,
        target,
        dispose,
      };

      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        /* older WebViews */
      }

      target.addEventListener("pointermove", onMove, { passive: false });
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [enabled, applyOver, clearVisual, clear],
  );

  const ghostNode =
    ghost && typeof document !== "undefined"
      ? createPortal(
          <div className="register-phone-move-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden>
            {ghost.label}
          </div>,
          document.body,
        )
      : null;

  return { onGripPointerDown, clear, ghost: ghostNode };
}
