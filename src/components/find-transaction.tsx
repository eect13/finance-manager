import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/finance/format";
import {
  cashRegisterLines,
  filterCashLines,
  KIND_LABEL,
  TYPE_FILTERS,
  type CashLine,
  type CashTypeFilter,
} from "@/lib/finance/register";
import { openCashLine } from "@/lib/finance/open-record";
import { useFinanceData } from "@/lib/finance/store";
import { findShortcutLabel } from "@/lib/hotkey";

export function FindTransaction({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useFinanceData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CashTypeFilter>("all");
  const [bankId, setBankId] = useState("all");

  useEffect(() => {
    if (open) {
      setQuery("");
      const id = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const raw = useMemo(
    () => (open ? cashRegisterLines(data).filter((l) => l.kind !== "opening") : []),
    [open, data],
  );
  const filtered = useMemo(() => {
    const q = query.trim();
    const byFields = filterCashLines(raw, {
      name: q,
      number: q,
      amount: q,
      type,
      bankId: bankId === "all" ? "" : bankId,
    });
    if (!q) return byFields;
    const lower = q.toLowerCase().replace(/^#/, "");
    return raw.filter((line) => {
      if (type !== "all" && line.kind !== type) return false;
      if (bankId !== "all" && line.bankId !== bankId) return false;
      const bank = data.banks.find((b) => b.id === line.bankId)?.nickname ?? "";
      const hay = `${line.party} ${line.memo} ${line.number} ${KIND_LABEL[line.kind]} ${bank} ${line.date}`.toLowerCase();
      const cents = line.payment || line.deposit;
      return hay.includes(lower) || String(cents / 100).includes(lower.replace(/,/g, "")) || byFields.includes(line);
    });
  }, [raw, query, type, bankId, data.banks]);

  const results = query.trim() || type !== "all" || bankId !== "all"
    ? filtered
    : [...raw].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 12);

  function openLine(line: CashLine) {
    openCashLine(line, data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Find transaction</DialogTitle>
          <DialogDescription>Search checks, receipts, and payments.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border py-3 pr-12 pl-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a payee, number, amount…"
            aria-label="Find transaction"
            className="h-10 min-h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <Select value={type} onValueChange={(v) => setType(v as CashTypeFilter)}>
            <SelectTrigger className="h-9 min-h-9" aria-label="Type">
              <SelectValue placeholder="Type" />
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
            <SelectTrigger className="h-9 min-h-9" aria-label="Bank">
              <SelectValue placeholder="Bank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any bank</SelectItem>
              {data.banks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nickname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="max-h-80 overflow-y-auto border-t border-border">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No matching transactions.</p>
          ) : (
            <ul>
              {results.map((line) => {
                const bank = data.banks.find((b) => b.id === line.bankId);
                return (
                  <li key={line.id}>
                    <button
                      type="button"
                      className="flex w-full min-h-11 items-center gap-3 px-4 py-2 text-left hover:bg-accent"
                      onClick={() => openLine(line)}
                    >
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">{formatDate(line.date)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{line.party}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {KIND_LABEL[line.kind]} {line.number} {bank ? `· ${bank.nickname}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm">
                        {line.payment ? (
                          <Money amount={line.payment} currency={data.settings.currency} className="text-debit" />
                        ) : (
                          <Money amount={line.deposit} currency={data.settings.currency} className="text-credit" />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="px-4 py-2 text-xs text-muted-foreground">
            {query.trim() || type !== "all" || bankId !== "all" ? `${results.length} found` : "Recent"} · click to open
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FindButton({ onClick }: { onClick: () => void }) {
  const [chord, setChord] = useState("Ctrl+K");
  useEffect(() => {
    setChord(findShortcutLabel());
  }, []);
  return (
    <>
      <Button variant="outline" size="icon" className="lg:hidden" aria-label="Find transaction" onClick={onClick}>
        <Search />
      </Button>
      <button
        type="button"
        onClick={onClick}
        className="hidden h-11 min-h-11 min-w-48 items-center gap-2 rounded-xl bg-muted px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground lg:inline-flex"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Find</span>
        <kbd className="rounded-sm bg-card px-1.5 py-0.5 text-xs font-medium">{chord}</kbd>
      </button>
    </>
  );
}
