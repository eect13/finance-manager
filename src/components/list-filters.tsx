import { useCallback, useState, type ReactNode } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { datePresetRange, type DatePreset } from "@/lib/finance/register";
import type { SortDir } from "@/lib/finance/sort";
import { cn } from "@/lib/utils";

export type FilterSelect = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

export type FilterSortOpt = { value: string; label: string };

export function applySortValue(set: (column: string, dir?: SortDir) => void, value: string) {
  const [key, dir] = value.split(":");
  set(key || "date", dir === "desc" ? "desc" : "asc");
}

export function useListPeriod(defaultPreset: DatePreset = "all") {
  const seed = datePresetRange(defaultPreset === "custom" ? "all" : defaultPreset);
  const [preset, setPreset] = useState<DatePreset>(defaultPreset);
  const [from, setFrom] = useState(seed.from);
  const [to, setTo] = useState(seed.to);

  const applyPreset = useCallback((next: DatePreset) => {
    setPreset(next);
    if (next === "custom") return;
    const range = datePresetRange(next);
    setFrom(range.from);
    setTo(range.to);
  }, []);

  const setDateFrom = useCallback((value: string) => {
    setPreset("custom");
    setFrom(value);
  }, []);

  const setDateTo = useCallback((value: string) => {
    setPreset("custom");
    setTo(value);
  }, []);

  const inRange = useCallback(
    (date: string) => {
      if (!date) return true;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    },
    [from, to],
  );

  const reset = useCallback(() => {
    applyPreset(defaultPreset);
  }, [applyPreset, defaultPreset]);

  return { preset, from, to, applyPreset, setDateFrom, setDateTo, inRange, reset };
}

export function listFiltersActiveCount({
  dateOn,
  datePreset,
  defaultPreset,
  selects,
}: {
  dateOn: boolean;
  datePreset?: DatePreset;
  defaultPreset: DatePreset;
  selects: FilterSelect[];
}) {
  return (dateOn && datePreset !== defaultPreset ? 1 : 0) + selects.filter((select) => select.value !== "all").length;
}

/** Filter controls only — used inside a phone bottom sheet or a desktop popover body. */
export function ListFiltersPanel({
  datePreset,
  dateFrom,
  dateTo,
  onPreset,
  onDateFrom,
  onDateTo,
  defaultPreset = "all",
  selects = [],
  sortValue,
  sortOptions,
  onSort,
  onClear,
  extra,
  className,
}: {
  datePreset?: DatePreset;
  dateFrom?: string;
  dateTo?: string;
  onPreset?: (preset: DatePreset) => void;
  onDateFrom?: (value: string) => void;
  onDateTo?: (value: string) => void;
  defaultPreset?: DatePreset;
  selects?: FilterSelect[];
  sortValue?: string;
  sortOptions?: FilterSortOpt[];
  onSort?: (value: string) => void;
  onClear?: () => void;
  extra?: ReactNode;
  className?: string;
}) {
  const dateOn = Boolean(onPreset);
  const active = listFiltersActiveCount({ dateOn, datePreset, defaultPreset, selects });

  return (
    <div className={cn("grid gap-3", className)}>
      {dateOn ? (
        <div className="grid gap-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Dates</p>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Date range">
            <Button
              type="button"
              size="sm"
              variant={datePreset === "month" ? "default" : "outline"}
              className="h-10 min-h-10"
              aria-pressed={datePreset === "month"}
              onClick={() => onPreset?.("month")}
            >
              This month
            </Button>
            <Button
              type="button"
              size="sm"
              variant={datePreset === "year" ? "default" : "outline"}
              className="h-10 min-h-10"
              aria-pressed={datePreset === "year"}
              onClick={() => onPreset?.("year")}
            >
              This year
            </Button>
            <Button
              type="button"
              size="sm"
              variant={datePreset === "all" ? "default" : "outline"}
              className="h-10 min-h-10"
              aria-pressed={datePreset === "all"}
              onClick={() => onPreset?.("all")}
            >
              All dates
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-[0.65rem] font-medium text-muted-foreground">Start</span>
              <Input
                type="date"
                value={dateFrom ?? ""}
                onChange={(e) => onDateFrom?.(e.target.value)}
                aria-label="From date"
                className="h-10 min-h-10"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[0.65rem] font-medium text-muted-foreground">End</span>
              <Input
                type="date"
                value={dateTo ?? ""}
                onChange={(e) => onDateTo?.(e.target.value)}
                aria-label="To date"
                className="h-10 min-h-10"
              />
            </label>
          </div>
        </div>
      ) : null}
      {selects.map((select) => (
        <div key={select.label} className="grid gap-1.5">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{select.label}</p>
          <Select value={select.value} onValueChange={select.onChange}>
            <SelectTrigger className="h-10 min-h-10" aria-label={select.label}>
              <SelectValue placeholder={select.label} />
            </SelectTrigger>
            <SelectContent>
              {select.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      {extra}
      {sortValue && sortOptions && onSort ? (
        <div className="grid gap-1.5">
          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">Sort</p>
          <Select value={sortValue} onValueChange={onSort}>
            <SelectTrigger className="h-10 min-h-10" aria-label="Sort">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {active && onClear ? (
        <button
          type="button"
          className="text-left text-sm font-medium text-muted-foreground phone-press"
          onClick={onClear}
        >
          {dateOn && defaultPreset === "month" ? "Back to this month" : "Clear filters"}
        </button>
      ) : null}
    </div>
  );
}

export function ListFilters({
  datePreset,
  dateFrom,
  dateTo,
  onPreset,
  onDateFrom,
  onDateTo,
  defaultPreset = "all",
  selects = [],
  sortValue,
  sortOptions,
  onSort,
  onClear,
  extra,
  /** When true, render the panel only (for phone bottom sheets). */
  embedded = false,
}: {
  datePreset?: DatePreset;
  dateFrom?: string;
  dateTo?: string;
  onPreset?: (preset: DatePreset) => void;
  onDateFrom?: (value: string) => void;
  onDateTo?: (value: string) => void;
  defaultPreset?: DatePreset;
  selects?: FilterSelect[];
  sortValue?: string;
  sortOptions?: FilterSortOpt[];
  onSort?: (value: string) => void;
  onClear?: () => void;
  extra?: ReactNode;
  embedded?: boolean;
}) {
  const dateOn = Boolean(onPreset);
  const active = listFiltersActiveCount({ dateOn, datePreset, defaultPreset, selects });

  const panel = (
    <ListFiltersPanel
      datePreset={datePreset}
      dateFrom={dateFrom}
      dateTo={dateTo}
      onPreset={onPreset}
      onDateFrom={onDateFrom}
      onDateTo={onDateTo}
      defaultPreset={defaultPreset}
      selects={selects}
      sortValue={sortValue}
      sortOptions={sortOptions}
      onSort={onSort}
      onClear={onClear}
      extra={extra}
    />
  );

  if (embedded) return panel;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-11 min-h-11 justify-start" aria-label="Filters">
          <Filter />
          Filters
          {active ? (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-medium text-primary-foreground">
              {active}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="end"
        onPointerDownOutside={(event) => {
          const el = event.target as HTMLElement | null;
          if (el?.closest("[data-radix-select-content]")) event.preventDefault();
        }}
      >
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Filters</p>
        {panel}
      </PopoverContent>
    </Popover>
  );
}
