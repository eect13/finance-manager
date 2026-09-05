import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "left" | "right" | "bottom" }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
      <SheetPrimitive.Content
        className={cn(
          "fixed z-50 flex min-h-0 flex-col overflow-hidden overscroll-contain",
          side === "bottom"
            ? "inset-x-0 bottom-0 max-h-[min(85dvh,40rem)] w-full rounded-t-2xl bg-card text-card-foreground sheet-bottom-panel pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-3"
            : "h-dvh max-h-dvh w-[min(18rem,100%)] bg-sidebar text-sidebar-foreground sheet-panel pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]",
          side === "left" && "inset-y-0 left-0",
          side === "right" && "inset-y-0 right-0",
          className,
        )}
        {...props}
      >
        {/* Guaranteed status-bar clearance when env(safe-area) is 0 on Android WebView */}
        <div className="sheet-sat shrink-0" aria-hidden />
        {children}
        {side !== "bottom" ? (
          <SheetPrimitive.Close className="absolute sheet-close right-4 rounded-md p-2 text-muted-foreground hover:bg-accent">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
