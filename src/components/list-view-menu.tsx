import { type ReactNode, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PhoneLayoutToggle } from "@/components/phone-layout-toggle";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ListView } from "@/components/view-toggle";
import { isNarrowUi } from "@/lib/phone-layout";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";

export function ListViewMenu({
  layout,
  onLayout,
  lead,
  extra,
  hiddenCount,
  onFitAll,
}: {
  layout?: ListView;
  onLayout?: (next: ListView) => void;
  lead?: ReactNode;
  extra?: ReactNode;
  hiddenCount?: number;
  onFitAll?: () => void;
}) {
  const phone = isNarrowUi();
  const [open, setOpen] = useState(false);
  const data = useFinanceData();
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const fontSize = data.settings.registerFontSize ?? 12;

  const body = (
    <>
      {lead}
      {layout && onLayout ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-sm font-medium">Layout</span>
            <p className="text-[0.7rem] text-muted-foreground">
              {phone ? "Cards or compact rows" : "Cards grid or table rows"}
            </p>
          </div>
          <PhoneLayoutToggle value={layout} onChange={onLayout} />
        </div>
      ) : null}
      {extra}
      {onFitAll && !phone ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-foreground"
          onClick={onFitAll}
        >
          Auto-fit columns
        </button>
      ) : null}
      <label className="mt-3 mb-1 flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Type size {fontSize}px</span>
        <input
          type="range"
          min={10}
          max={18}
          step={1}
          value={fontSize}
          aria-label="List type size"
          className="w-full accent-primary"
          onChange={(e) => updateSettings({ registerFontSize: Number(e.target.value) })}
        />
      </label>
      <p className="text-[0.7rem] text-muted-foreground">Same type size as every list (Options → Display).</p>
    </>
  );

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className="h-11 min-h-11 justify-start"
      aria-label="View options"
      title="View — layout and type size"
    >
      <SlidersHorizontal />
      View
      {hiddenCount ? (
        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[0.65rem] font-medium">
          {hiddenCount}
        </span>
      ) : null}
    </Button>
  );

  if (phone) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-h-11 justify-start phone-press"
          aria-label="View options"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal />
          View
          {hiddenCount ? (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[0.65rem] font-medium">
              {hiddenCount}
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
            onInteractOutside={(event) => {
              const el = event.target as HTMLElement | null;
              if (el?.closest("[data-radix-select-content]")) event.preventDefault();
            }}
            onFocusOutside={(event) => {
              const el = event.target as HTMLElement | null;
              if (el?.closest("[data-radix-select-content]")) event.preventDefault();
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-base font-semibold">View</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
            <div className="max-h-[min(75dvh,36rem)] overflow-y-auto pb-2">{body}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {body}
      </PopoverContent>
    </Popover>
  );
}
