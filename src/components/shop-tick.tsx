import { Check, Lock, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShopTick({
  checked,
  indeterminate,
  onChange,
  label,
  locked,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (on: boolean) => void;
  label: string;
  locked?: boolean;
}) {
  const on = checked || Boolean(indeterminate);
  function stop(e: { stopPropagation: () => void; preventDefault?: () => void }) {
    e.stopPropagation();
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-disabled={locked || undefined}
      aria-label={label}
      title={locked ? "On a finished statement. Undo that rec to change this line." : undefined}
      onPointerDown={stop}
      onMouseDown={stop}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      onDoubleClick={stop}
      className={cn(
        "register-tick relative z-10 inline-flex h-full min-h-10 min-w-10 w-full items-center justify-center bg-transparent",
        locked && "is-locked",
      )}
    >
      {locked ? (
        <Lock className="size-3.5 text-muted-foreground/70" aria-hidden />
      ) : (
        <span
          className={cn(
            "pointer-events-none inline-flex size-5 shrink-0 items-center justify-center rounded-xs border-2",
            on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
          )}
        >
          {indeterminate ? <Minus className="size-3 stroke-[3]" /> : checked ? <Check className="size-3 stroke-[3]" /> : null}
        </span>
      )}
    </button>
  );
}