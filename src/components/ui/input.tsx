import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ref, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[box-shadow,border-color] duration-150",
        "placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}
