import { useState, type ReactNode } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/**
 * Phone-only: toolbar Filters button opens a bottom sheet with the *panel* content.
 * Pass `embedded` ListFilters (or ListFiltersPanel) as children — never the popover trigger.
 * Desktop: renders children as-is (caller should pass the normal popover ListFilters).
 */
export function PhoneFiltersSheet({
  title = "Filters",
  children,
  phone,
  activeCount = 0,
  onClear,
}: {
  title?: string;
  children: ReactNode;
  phone: boolean;
  activeCount?: number;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!phone) return <>{children}</>;
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-11 min-h-11 justify-start phone-press"
        aria-label={title}
        onClick={() => setOpen(true)}
      >
        <Filter />
        {title}
        {activeCount > 0 ? (
          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="gap-0 px-4"
          onPointerDownOutside={(event) => {
            const el = event.target as HTMLElement | null;
            if (el?.closest("[data-radix-select-content]")) event.preventDefault();
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-base font-semibold">{title}</p>
            <div className="flex items-center gap-1">
              {activeCount > 0 && onClear ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => onClear()}
                >
                  Clear all
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
          <div className="max-h-[min(70dvh,32rem)] space-y-3 overflow-y-auto pb-2">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
