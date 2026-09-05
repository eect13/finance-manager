import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipPortal = TooltipPrimitive.Portal;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-[220] max-w-xs rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background elevation outline-none",
          "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

/** Hover tip for icon chrome. Prefer wrapping disabled buttons in a span. */
export function Tip({
  label,
  children,
  side = "bottom",
  disabled,
}: {
  label: string;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  /** Skip the tip (e.g. on phone) — still renders children. */
  disabled?: boolean;
}) {
  if (disabled || !label) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
