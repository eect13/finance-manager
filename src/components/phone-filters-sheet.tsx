import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

/** Phone-only: packs filter controls into a bottom sheet. Desktop callers still render children inline. */
export function PhoneFiltersSheet({
  title = "Filters",
  children,
  phone,
}: {
  title?: string;
  children: ReactNode;
  phone: boolean;
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
        <SlidersHorizontal />
        {title}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="gap-0 px-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{title}</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
          <div className="max-h-[min(70dvh,32rem)] space-y-3 overflow-y-auto pb-2">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
