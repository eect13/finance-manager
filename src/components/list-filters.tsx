import { useCallback, useState, type ReactNode } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { datePresetRange, type DatePreset } from "@/lib/finance/register";
import type { SortDir } from "@/lib/finance/sort";

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
}) {
  const dateOn = Boolean(onPreset);
  const active =
    (dateOn && datePreset !== defaultPreset ? 1 : 0) +
    selects.filter((select) => select.value !== "all").length;

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
        <div className="grid gap-2">
          {dateOn ? (
            <>
              <div className="grid grid-cols-3 gap-1" role="group" aria-label="Date range">
                <Button type="button" size="sm" variant={datePreset === "month" ? "default" : "outline"} aria-pressed={datePreset === "month"} onClick={() => onPreset?.("month")}>
                  Month
                </Button>
                <Button type="button" size="sm" variant={datePreset === "year" ? "default" : "outline"} aria-pressed={datePreset === "year"} onClick={() => onPreset?.("year")}>
                  Year
                </Button>
                <Button type="button" size="sm" variant={datePreset === "all" ? "default" : "outline"} aria-pressed={datePreset === "all"} onClick={() => onPreset?.("all")}>
                  All dates
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={dateFrom ?? ""} onChange={(e) => onDateFrom?.(e.target.value)} aria-label="From date" className="h-9 min-h-9" />
                <Input type="date" value={dateTo ?? ""} onChange={(e) => onDateTo?.(e.target.value)} aria-label="To date" className="h-9 min-h-9" />
              </div>
            </>
          ) : null}
          {selects.map((select) => (
            <Select key={select.label} value={select.value} onValueChange={select.onChange}>
              <SelectTrigger className="h-9 min-h-9" aria-label={select.label}>
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
          ))}
          {extra}
          {sortValue && sortOptions && onSort ? (
            <Select value={sortValue} onValueChange={onSort}>
              <SelectTrigger className="h-9 min-h-9" aria-label="Sort">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    Sort · {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {active && onClear ? (
            <button type="button" className="text-left text-xs font-medium text-muted-foreground" onClick={onClear}>
              {dateOn && defaultPreset === "month" ? "Back to this month" : "Clear filters"}
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
