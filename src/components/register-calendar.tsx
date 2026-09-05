import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { setCashDragImage } from "@/components/drag-handle";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, currentMonth, todayIso } from "@/lib/finance/format";
import {
  calendarGridRange,
  cashBook,
  cashCalendar,
  filterCashLines,
  isTransferMate,
  KIND_LABEL,
  monthLabel,
  rescheduleKind,
  shiftMonth,
  transferDragCaption,
  TYPE_FILTERS,
  type CashLine,
  type CashTypeFilter,
} from "@/lib/finance/register";
import { openCashLine } from "@/lib/finance/open-record";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PILL_CAP = 3;

export function CashCalendar() {
  const data = useFinanceData();
  const rescheduleCashLine = useFinanceStore((s) => s.rescheduleCashLine);
  const [month, setMonth] = useState(currentMonth());
  const [picked, setPicked] = useState<string | null>(todayIso());
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CashTypeFilter>("all");
  const [bankId, setBankId] = useState("all");
  const [dragging, setDragging] = useState<string | null>(null);
  const [overDate, setOverDate] = useState<string | null>(null);

  const gridRange = useMemo(() => calendarGridRange(month), [month]);
  const raw = useMemo(
    () => cashBook(data, bankId === "all" ? undefined : bankId, { dateFrom: gridRange.from, dateTo: gridRange.to }).lines,
    [data, bankId, gridRange],
  );
  const lines = useMemo(
    () => filterCashLines(raw, { type, name: query }).filter((l) => l.kind !== "opening"),
    [raw, type, query],
  );
  const days = useMemo(() => cashCalendar(lines, month), [lines, month]);
  const selected = days.find((d) => d.date === picked) ?? null;
  const draggingLine = dragging ? lines.find((l) => l.id === dragging) ?? null : null;
  const draggingSourceId = draggingLine?.kind === "transfer" ? draggingLine.sourceId : null;

  function moveLine(line: CashLine, date: string) {
    const kind = rescheduleKind(line.kind);
    if (!kind || !line.reschedulable) return;
    if (line.date === date) return;
    try {
      rescheduleCashLine({ kind, sourceId: line.sourceId, date });
      setPicked(date);
      if (line.kind === "transfer") toast.success(`Transfer moved to ${formatDate(date)} — both banks.`);
      else toast.success(`${line.party} moved to ${formatDate(date)}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not move.");
    }
  }

  function parseDrag(e: DragEvent): CashLine | null {
    try {
      const id = e.dataTransfer.getData("text/plain");
      return lines.find((l) => l.id === id) ?? null;
    } catch {
      return null;
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="cal-toolbar">
        <div className="flex min-w-0 items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setMonth(currentMonth())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            <ChevronLeft />
          </Button>
          <h2 className="min-w-0 flex-1 truncate text-center font-display text-xl font-medium tracking-tight sm:min-w-44 sm:flex-none sm:text-2xl">{monthLabel(month)}</h2>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            <ChevronRight />
          </Button>
        </div>
        <div className="field-grid-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter payee"
              aria-label="Filter calendar"
              className="h-9 min-h-9 pl-9"
            />
          </div>
          <Select value={type} onValueChange={(v) => setType(v as CashTypeFilter)}>
            <SelectTrigger className="h-9 min-h-9" aria-label="Filter by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bankId} onValueChange={setBankId}>
            <SelectTrigger className="h-9 min-h-9" aria-label="Filter by bank">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All banks</SelectItem>
              {data.banks.filter((b) => !b.archived).map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nickname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="workspace-split-cal min-w-0 gap-4">
        <div className="notion-cal min-w-0">
          <div className="notion-cal-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
                <span className="hidden sm:inline">{day}</span>
              </span>
            ))}
          </div>
          <div className="notion-cal-days">
            {days.map((day) => {
              const extra = Math.max(0, day.lines.length - PILL_CAP);
              const shown = day.lines.slice(0, PILL_CAP);
              return (
                <div
                  key={day.date}
                  role="button"
                  tabIndex={0}
                  data-outside={day.inMonth ? undefined : "true"}
                  data-today={day.today ? "true" : undefined}
                  data-active={picked === day.date ? "true" : undefined}
                  data-drop={overDate === day.date ? "true" : undefined}
                  className="notion-cal-day"
                  onClick={() => setPicked(day.date)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setPicked(day.date);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverDate(day.date);
                  }}
                  onDragLeave={(e) => {
                    const related = e.relatedTarget as Node | null;
                    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
                    setOverDate(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const line = parseDrag(e);
                    setOverDate(null);
                    setDragging(null);
                    if (line) moveLine(line, day.date);
                  }}
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className="notion-cal-num">{Number(day.date.slice(8))}</span>
                    {day.count > 0 ? <span className="notion-cal-count sm:hidden">{day.count}</span> : null}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                    {shown.map((line) => (
                      <EventPill
                        key={line.id}
                        line={line}
                        dragging={dragging === line.id || isTransferMate(line, draggingSourceId)}
                        onOpen={() => openCashLine(line, data)}
                        onDragStart={() => setDragging(line.id)}
                        onDragEnd={() => {
                          setDragging(null);
                          setOverDate(null);
                        }}
                      />
                    ))}
                    {extra > 0 ? (
                      <span className="notion-cal-more px-1 text-left text-xs font-medium text-muted-foreground">+{extra} more</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DayPanel
          date={selected?.date ?? picked}
          lines={selected?.lines ?? []}
          currency={data.settings.currency}
          banks={data.banks}
          onOpen={(line) => openCashLine(line, data)}
        />
      </div>
    </div>
  );
}

function EventPill({
  line,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  line: CashLine;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <span
      draggable={line.reschedulable}
      data-dir={line.deposit > 0 ? "in" : "out"}
      data-dragging={dragging ? "true" : undefined}
      className="notion-cal-pill"
      title={`${line.party} · ${KIND_LABEL[line.kind]}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onDragStart={(e) => {
        if (!line.reschedulable) {
          e.preventDefault();
          return;
        }
        e.stopPropagation();
        e.dataTransfer.setData("text/plain", line.id);
        e.dataTransfer.effectAllowed = "move";
        setCashDragImage(e, transferDragCaption(line));
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <span className="min-w-0 flex-1 truncate">{line.party}</span>
    </span>
  );
}

function DayPanel({
  date,
  lines,
  currency,
  banks,
  onOpen,
}: {
  date: string | null;
  lines: CashLine[];
  currency: string;
  banks: { id: string; nickname: string }[];
  onOpen: (line: CashLine) => void;
}) {
  if (!date) {
    return (
      <div className="rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground elevation">
        Select a day to see its cash.
      </div>
    );
  }
  const inflow = lines.reduce((s, l) => s + l.deposit, 0);
  const outflow = lines.reduce((s, l) => s + l.payment, 0);
  return (
    <div className="rounded-2xl bg-card elevation lg:sticky lg:top-24">
      <div className="border-b border-border px-4 py-3">
        <p className="font-medium">{formatDate(date)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {lines.length === 0
            ? "No cash this day"
            : `${lines.length} ${lines.length === 1 ? "entry" : "entries"}`}
          {inflow ? " · in " : ""}
          {inflow ? <Money amount={inflow} currency={currency} className="inline text-credit" /> : null}
          {outflow ? " · out " : ""}
          {outflow ? <Money amount={outflow} currency={currency} className="inline text-debit" /> : null}
        </p>
      </div>
      {lines.length === 0 ? (
        <p className="px-4 py-5 text-center text-sm text-muted-foreground">Empty day. Drag a card here to reschedule.</p>
      ) : (
        <ul>
          {lines.map((line) => {
            const bank = banks.find((b) => b.id === line.bankId);
            return (
              <li key={line.id}>
                <button
                  type="button"
                  className="flex w-full min-h-11 items-center gap-3 px-4 py-2 text-left hover:bg-accent"
                  onClick={() => onOpen(line)}
                >
                  <span
                    className={cn(
                      "inline-block size-2 shrink-0 rounded-full",
                      line.deposit > 0 ? "bg-credit" : "bg-debit",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{line.party}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {KIND_LABEL[line.kind]}
                      {line.number ? ` ${line.number}` : ""}
                      {bank ? ` · ${bank.nickname}` : ""}
                    </span>
                  </span>
                  {line.payment ? (
                    <Money amount={line.payment} currency={currency} className="text-debit" />
                  ) : (
                    <Money amount={line.deposit} currency={currency} className="text-credit" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
