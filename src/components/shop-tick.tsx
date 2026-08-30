import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShopTick({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  const on = checked || Boolean(indeterminate);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn(
        "relative inline-flex size-5 shrink-0 items-center justify-center rounded-xs border-2 transition-colors duration-150",
        "after:absolute after:top-1/2 after:left-1/2 after:size-9 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-xs",
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-card hover:border-primary/60",
      )}
    >
      {indeterminate ? <Minus className="size-3 stroke-[3]" /> : checked ? <Check className="size-3 stroke-[3]" /> : null}
    </button>
  );
}
