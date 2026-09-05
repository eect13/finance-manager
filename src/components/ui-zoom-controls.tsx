import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { useListDensity, type ListDensity } from "@/lib/list-density";
import { UI_ZOOM_MAX, UI_ZOOM_MIN, UI_ZOOM_STEP, useUiZoom } from "@/lib/ui-zoom";
import { cn } from "@/lib/utils";

export function DisplayZoomHeaderControl({ className }: { className?: string }) {
  const { percent, zoomIn, zoomOut, canZoomIn, canZoomOut, reset } = useUiZoom();
  return (
    <div
      className={cn(
        "ui-zoom-header flex items-center rounded-xl border border-border bg-background",
        className,
      )}
      role="group"
      aria-label="Display zoom"
    >
      <Tip label="Zoom out">
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-r-none"
            aria-label="Zoom out"
            disabled={!canZoomOut}
            onClick={zoomOut}
          >
            <Minus className="size-3.5" />
          </Button>
        </span>
      </Tip>
      <Tip label={`Display zoom ${percent}% — click to reset`}>
        <button
          type="button"
          className="ui-zoom-pct min-w-[2.75rem] px-0.5 text-center text-[11px] font-medium tabular-nums text-muted-foreground hover:text-foreground"
          aria-label={`Display zoom ${percent} percent. Tap to reset`}
          onClick={reset}
        >
          {percent}%
        </button>
      </Tip>
      <Tip label="Zoom in">
        <span className="inline-flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-l-none"
            aria-label="Zoom in"
            disabled={!canZoomIn}
            onClick={zoomIn}
          >
            <Plus className="size-3.5" />
          </Button>
        </span>
      </Tip>
    </div>
  );
}

export function DisplayZoomSettings() {
  const { zoom, percent, setZoom, zoomIn, zoomOut, reset, canZoomIn, canZoomOut } = useUiZoom();
  return (
    <div className="grid gap-3 rounded-xl bg-muted/70 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Display zoom</p>
          <p className="text-xs text-muted-foreground">
            Shrink to see wide screens like Customers on a phone. Pinch zoom also works.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="outline" size="icon" aria-label="Zoom out" disabled={!canZoomOut} onClick={zoomOut}>
            <Minus className="size-4" />
          </Button>
          <span className="min-w-[3.25rem] text-center text-sm font-medium tabular-nums" aria-live="polite">
            {percent}%
          </span>
          <Button type="button" variant="outline" size="icon" aria-label="Zoom in" disabled={!canZoomIn} onClick={zoomIn}>
            <Plus className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={percent === 100}>
            Reset
          </Button>
        </div>
      </div>
      <input
        type="range"
        className="w-full accent-primary"
        min={UI_ZOOM_MIN}
        max={UI_ZOOM_MAX}
        step={UI_ZOOM_STEP}
        value={zoom}
        aria-label="Display zoom"
        onChange={(e) => setZoom(Number(e.target.value))}
      />
    </div>
  );
}


export function ListDensitySettings() {
  const { density, setDensity } = useListDensity();
  const options: { id: ListDensity; label: string; hint: string }[] = [
    { id: "comfortable", label: "Comfortable", hint: "Default padding — matches Reconcile tick spacing" },
    { id: "compact", label: "Compact", hint: "Tighter rows when lists feel spacious" },
  ];
  return (
    <div className="grid gap-3 rounded-xl bg-muted/70 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">List density</p>
        <p className="text-xs text-muted-foreground">
          One spacing rule for every list tab (Register, Reconcile, Invoices, …). Saved on this device.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="List density">
        {options.map((opt) => (
          <Button
            key={opt.id}
            type="button"
            size="sm"
            variant={density === opt.id ? "default" : "outline"}
            aria-pressed={density === opt.id}
            title={opt.hint}
            onClick={() => setDensity(opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
