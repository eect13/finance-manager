import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { addDaysIso, isoToTyped, maskTypedDate, todayIso, typedToIso } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isoDate(value: string): Date | null {
  if (!value) return null;
  const date = parseISO(value);
  return isValid(date) ? date : null;
}

export function DateInput({
  value,
  onChange,
  allowEmpty = false,
  disabled,
  className,
  id,
  name,
  tabIndex,
  inputRef,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (iso: string) => void;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  tabIndex?: number;
  inputRef?: RefObject<HTMLInputElement | null>;
  "aria-label"?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(() => isoToTyped(value));
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 280 });

  useEffect(() => {
    if (!focused) setText(isoToTyped(value));
  }, [value, focused]);

  function commit(raw: string) {
    const iso = typedToIso(raw);
    if (iso === "") {
      if (allowEmpty) {
        onChange("");
        setText("");
        return;
      }
      setText(isoToTyped(value));
      return;
    }
    if (!iso) {
      setText(isoToTyped(value));
      return;
    }
    onChange(iso);
    setText(isoToTyped(iso));
  }

  function pick(iso: string) {
    onChange(iso);
    setText(isoToTyped(iso));
    setOpen(false);
  }

  function layout() {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 280;
    let left = r.left;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    if (left < 8) left = 8;
    const height = 320;
    let top = r.bottom + 4;
    if (top + height > window.innerHeight - 8) top = Math.max(8, r.top - height - 4);
    setBox({ top, left, width });
  }

  useLayoutEffect(() => {
    if (!open) return;
    layout();
    function onScroll() {
      layout();
    }
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function down(e: PointerEvent) {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    }
    function key(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
    window.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="date-input relative w-full">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="MM/DD/YYYY"
        disabled={disabled}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        value={text}
        className={cn("tabular-nums pr-10", className)}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onChange={(e) => {
          const next = maskTypedDate(e.target.value);
          setText(next);
          const iso = typedToIso(next);
          if (iso) onChange(iso);
          else if (allowEmpty && next === "") onChange("");
        }}
        onBlur={() => {
          setFocused(false);
          commit(text);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(text);
            return;
          }
          if (e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key === "ArrowDown" && !disabled) {
            e.preventDefault();
            setOpen(true);
            return;
          }
          if ((e.key === "t" || e.key === "T") && !disabled) {
            e.preventDefault();
            pick(todayIso());
            return;
          }
          if ((e.key === "+" || e.key === "=") && !disabled && value) {
            e.preventDefault();
            pick(addDaysIso(value, 1));
            return;
          }
          if ((e.key === "-" || e.key === "_") && !disabled && value) {
            e.preventDefault();
            pick(addDaysIso(value, -1));
          }
        }}
      />
      <button
        type="button"
        className="date-input-cal absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Open calendar"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
      >
        <ChevronDown className="size-4 shrink-0" />
      </button>
      {open && !disabled
        ? createPortal(
            <div
              ref={popRef}
              className="date-cal-pop"
              data-date-cal=""
              role="dialog"
              aria-label="Choose date"
              style={{ top: box.top, left: box.left, width: box.width }}
            >
              <DateCal value={value} onPick={pick} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function DateCal({ value, onPick }: { value: string; onPick: (iso: string) => void }) {
  const selected = isoDate(value);
  const today = parseISO(todayIso());
  const [month, setMonth] = useState(() => selected ?? today);
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  useEffect(() => {
    if (selected) setMonth(selected);
  }, [value]);

  return (
    <div className="date-cal">
      <div className="date-cal-head">
        <button type="button" aria-label="Previous month" onClick={() => setMonth((m) => subMonths(m, 1))}>
          <ChevronLeft className="size-4" />
        </button>
        <span>{format(month, "MMMM yyyy")}</span>
        <button type="button" aria-label="Next month" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="date-cal-week">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="date-cal-grid">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          return (
            <button
              key={iso}
              type="button"
              data-outside={isSameMonth(day, month) ? undefined : "true"}
              data-today={isSameDay(day, today) ? "true" : undefined}
              data-selected={selected && isSameDay(day, selected) ? "true" : undefined}
              onClick={() => onPick(iso)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <button type="button" className="date-cal-today" onClick={() => onPick(todayIso())}>
        Today
      </button>
    </div>
  );
}
