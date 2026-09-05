import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PhoneSwipeAction = {
  label: string;
  onAction: () => void;
  tone?: "default" | "danger" | "success";
};

/**
 * Phone-only horizontal reveal. Vertical scroll wins; Move grips should stopPropagation on their own pointers.
 * Desktop / disabled: renders children only.
 */
export function PhoneSwipe({
  enabled,
  actions,
  children,
  className,
}: {
  enabled: boolean;
  actions: PhoneSwipeAction[];
  children: ReactNode;
  className?: string;
}) {
  const startX = useRef(0);
  const startY = useRef(0);
  const locked = useRef<"h" | "v" | null>(null);
  const [dx, setDx] = useState(0);
  const open = Math.abs(dx) > 48;

  if (!enabled || actions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  const max = Math.min(72 * actions.length, 160);

  function onDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    locked.current = null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const mx = e.clientX - startX.current;
    const my = e.clientY - startY.current;
    if (!locked.current) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      locked.current = Math.abs(my) > Math.abs(mx) ? "v" : "h";
      if (locked.current === "v") {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        return;
      }
    }
    if (locked.current !== "h") return;
    e.preventDefault();
    // swipe left reveals actions on the right
    setDx(Math.max(-max, Math.min(0, mx)));
  }

  function onUp(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) && locked.current !== "h") {
      locked.current = null;
      return;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ok */
    }
    setDx((cur) => (cur < -48 ? -max : 0));
    locked.current = null;
  }

  return (
    <div className={cn("phone-swipe", className)}>
      <div className="phone-swipe-actions" aria-hidden={!open}>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className={cn(
              "phone-swipe-btn",
              a.tone === "danger" && "is-danger",
              a.tone === "success" && "is-success",
            )}
            onClick={() => {
              a.onAction();
              setDx(0);
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div
        className="phone-swipe-front"
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {children}
      </div>
    </div>
  );
}
