import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhoneLayout } from "@/lib/phone-layout";

export function PhoneLayoutToggle({
  value,
  onChange,
  className,
}: {
  value: PhoneLayout;
  onChange: (next: PhoneLayout) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "phone-layout-toggle inline-flex items-center rounded-xl border border-border bg-background p-0.5",
        className,
      )}
      role="group"
      aria-label="Layout"
    >
      <button
        type="button"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground",
          value === "grid" && "bg-primary text-primary-foreground",
        )}
        aria-label="Grid cards"
        aria-pressed={value === "grid"}
        title="Grid"
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground",
          value === "list" && "bg-primary text-primary-foreground",
        )}
        aria-label="List rows"
        aria-pressed={value === "list"}
        title="List"
        onClick={() => onChange("list")}
      >
        <List className="size-4" />
      </button>
    </div>
  );
}
