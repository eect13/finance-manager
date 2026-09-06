import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

const DESK_DRAG_MQ = "(max-width: 767px), ((hover: none) and (pointer: coarse))";

function deskDialogDrag() {
  if (typeof window === "undefined") return false;
  return !window.matchMedia(DESK_DRAG_MQ).matches;
}

export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-foreground/40", className)}
      {...props}
    />
  );
}

export function DialogContent({ className, overlayClassName, children, onPointerDownOutside, onInteractOutside, onFocusOutside, onPointerDown, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { overlayClassName?: string }) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef({ on: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  function keepDateCal(event: { target: EventTarget | null; preventDefault: () => void }) {
    const node = event.target;
    if (node instanceof Element && node.closest("[data-date-cal], [data-party-list]")) event.preventDefault();
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    if (!deskDialogDrag()) return;
    const node = event.target;
    if (!(node instanceof Element) || !node.closest("[data-dialog-drag]")) return;
    if (node.closest("button, input, textarea, select, a, [role='button']")) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    event.preventDefault();
    const ox = Number.parseFloat(sheet.style.getPropertyValue("--dialog-x") || "0") || 0;
    const oy = Number.parseFloat(sheet.style.getPropertyValue("--dialog-y") || "0") || 0;
    drag.current = { on: true, sx: event.clientX, sy: event.clientY, ox, oy };
    sheet.dataset.dragging = "true";
    function move(ev: PointerEvent) {
      if (!drag.current.on || !sheetRef.current) return;
      const x = drag.current.ox + (ev.clientX - drag.current.sx);
      const y = drag.current.oy + (ev.clientY - drag.current.sy);
      sheetRef.current.style.setProperty("--dialog-x", `${x}px`);
      sheetRef.current.style.setProperty("--dialog-y", `${y}px`);
    }
    function up() {
      drag.current.on = false;
      if (sheetRef.current) delete sheetRef.current.dataset.dragging;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={sheetRef}
        className={cn(
          "dialog-sheet z-50 grid w-[calc(100%-2rem)] max-w-lg min-w-0 max-h-[min(90dvh,44rem)] overflow-x-hidden overflow-y-auto rounded-3xl bg-card p-6 text-card-foreground elevation overscroll-contain",
          className,
        )}
        onPointerDown={(event) => {
          startDrag(event);
          onPointerDown?.(event);
        }}
        onPointerDownOutside={(event) => {
          keepDateCal(event);
          onPointerDownOutside?.(event);
        }}
        onInteractOutside={(event) => {
          keepDateCal(event);
          onInteractOutside?.(event);
        }}
        onFocusOutside={(event) => {
          keepDateCal(event);
          onFocusOutside?.(event);
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-dialog-drag className={cn("dialog-drag-handle mb-4 flex flex-col items-center gap-1 text-center", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("font-display text-xl font-medium tracking-tight text-center", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground text-center", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
