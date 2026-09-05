import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const THRESHOLD_PX = 10;

type OverTarget =
  | { kind: "date"; date: string }
  | { kind: "row"; id: string; date: string }
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

export type PhoneMoveDragApi = {
  /** Attach to a reschedulable grip (caller toasts locked separately). */
  onGripPointerDown: (lineId: string, e: ReactPointerEvent) => void;
  /** True for a beat after a successful drop — ignore chip click toasts. */
  consumeChipClickGuard: () => boolean;
  clear: () => void;
  ghost: ReactNode;
};

/**
 * Pointer-based Move dates for phone (Android WebView-safe).
 * Does not use HTML5 draggable. Grip → ghost → hit-test date chips / row drop zones.
 */
export function usePhoneMoveDrag({
  enabled,
  onDragId,
  onOverDate,
  onOverRow,
  onDrop,
  captionFor,
  onTapWithoutDrag,
}: {
  enabled: boolean;
  onDragId: (id: string | null) => void;
  onOverDate: (date: string | null) => void;
  onOverRow: (id: string | null) => void;
  onDrop: (lineId: string, date: string) => void;
  captionFor: (id: string) => string;
  onTapWithoutDrag?: () => void;
}): PhoneMoveDragApi {
  const [ghost, setGhost] = useState<{ x: number; y: number; label: string } | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const lastOverRef = useRef<OverTarget>(null);
  const rafRef = useRef(0);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressChipRef = useRef(false);
  const cbs = useRef({ onDragId, onOverDate, onOverRow, onDrop, captionFor, onTapWithoutDrag });
  cbs.current = { onDragId, onOverDate, onOverRow, onDrop, captionFor, onTapWithoutDrag };

  const applyOver = useCallback((over: OverTarget) => {
    const prev = lastOverRef.current;
    const same =
      prev === over ||
      (prev !== null &&
        over !== null &&
        prev.kind === over.kind &&
        (over.kind === "date"
          ? prev.kind === "date" && prev.date === over.date
          : prev.kind === "row" && over.kind === "row" && prev.id === over.id));
    if (same) return;
    lastOverRef.current = over;
    cbs.current.onOverDate(over?.kind === "date" ? over.date : null);
    cbs.current.onOverRow(over?.kind === "row" ? over.id : null);
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
    cbs.current.onOverDate(null);
    cbs.current.onOverRow(null);
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
      // Replace any in-flight gesture (rare).
      if (sessionRef.current) clear();

      e.stopPropagation();
      // Keep the gesture on the grip; preventDefault + touch-action:none stop scroll steal.
      e.preventDefault();

      const target = e.currentTarget as HTMLElement;
      const label = cbs.current.captionFor(lineId);

      const hitTest = (x: number, y: number): OverTarget => {
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        if (!el) return null;
        const dateEl = el.closest("[data-move-date]") as HTMLElement | null;
        const date = dateEl?.dataset.moveDate;
        if (date) return { kind: "date", date };
        const rowEl = el.closest("[data-move-row]") as HTMLElement | null;
        const rowId = rowEl?.dataset.moveRow;
        const rowDate = rowEl?.dataset.moveRowDate;
        if (rowId && rowDate && rowId !== lineId) return { kind: "row", id: rowId, date: rowDate };
        return null;
      };

      const flushFrame = () => {
        rafRef.current = 0;
        const s = sessionRef.current;
        const pt = pendingPointRef.current;
        if (!s?.active || !pt) return;
        setGhost({ x: pt.x, y: pt.y, label: s.label });
        applyOver(hitTest(pt.x, pt.y));
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
        const date = over?.kind === "date" ? over.date : over?.kind === "row" ? over.date : null;
        clearVisual();
        if (date) {
          suppressChipRef.current = true;
          window.setTimeout(() => {
            suppressChipRef.current = false;
          }, 450);
          cbs.current.onDrop(s.id, date);
        } else {
          // Past threshold (active drag) but released off chip/row — brief hint, not on tiny taps.
          toast.message("Drop on a date or row.");
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

  const consumeChipClickGuard = useCallback(() => {
    if (!suppressChipRef.current) return false;
    suppressChipRef.current = false;
    return true;
  }, []);

  const ghostNode =
    ghost && typeof document !== "undefined"
      ? createPortal(
          <div className="register-phone-move-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden>
            {ghost.label}
          </div>,
          document.body,
        )
      : null;

  return { onGripPointerDown, consumeChipClickGuard, clear, ghost: ghostNode };
}
