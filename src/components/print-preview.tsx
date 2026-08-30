import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Money } from "@/components/money";
import { CheckBadge, ReceiptBadge, StatusLabel } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, todayIso } from "@/lib/finance/format";
import { KIND_LABEL, type BalancedCashLine, type CashLine } from "@/lib/finance/register";
import {
  DEFAULT_REGISTER_COLS,
  REGISTER_COL_CLASS,
  REGISTER_COLS,
  toggleRegisterCol,
  type RegisterColId,
  type RegisterCols,
} from "@/lib/finance/types";
import { cn } from "@/lib/utils";
import { ColumnChips } from "@/components/column-chips";

type Orient = "portrait" | "landscape";
type Scope = "one" | "all";
type ColId = RegisterColId;

const ROWS: Record<Orient, number> = {
  portrait: 16,
  landscape: 12,
};

function chunkPages<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

function PrintStatus({ line }: { line: CashLine }) {
  if (line.kind === "check") {
    return <CheckBadge status={line.status as "pending" | "cleared" | "voided" | "bounced"} />;
  }
  if (line.kind === "receipt" || line.kind === "payment") {
    return (
      <ReceiptBadge
        status={line.status as "posted" | "void"}
        kind={line.kind === "receipt" ? "cash-sale" : "payment"}
        method={line.method}
      />
    );
  }
  if (line.kind === "transfer") return <Badge variant="internal">Internal</Badge>;
  if (!line.status) return null;
  return <StatusLabel status={line.status} />;
}

export function RegisterPrintPreview({
  open,
  onClose,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  bankLabel,
  lines,
  banks,
  currency,
  fontSize,
  cols,
  onColsChange,
  onToggleCol,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  bankLabel: string;
  lines: BalancedCashLine[];
  banks: { id: string; nickname: string }[];
  currency: string;
  fontSize?: number;
  cols: RegisterCols;
  onColsChange: (cols: RegisterCols) => void;
  onToggleCol?: (id: RegisterColId) => void;
}) {
  const [scope, setScope] = useState<Scope>("all");
  const [orient, setOrient] = useState<Orient>("portrait");
  const [page, setPage] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [printReady, setPrintReady] = useState(false);
  const pages = useMemo(() => chunkPages(lines, ROWS[orient]), [lines, orient]);
  const pageCount = pages.length;
  const current = Math.min(page, pageCount - 1);
  const grandOut = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.payment, 0);
  const grandIn = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.deposit, 0);
  const grandLast = lines.at(-1)?.balance ?? 0;
  const printIndexes = scope === "one" ? [current] : pages.map((_, i) => i);
  const shownCount = REGISTER_COLS.filter((c) => cols[c.id]).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("printing-preview");
    document.body.dataset.printScope = scope;
    document.body.dataset.printOrient = orient;
    const style = document.createElement("style");
    style.setAttribute("data-register-print-page", "true");
    style.textContent = `@page { size: ${orient}; margin: 0.45in; }`;
    document.head.appendChild(style);
    return () => {
      document.body.classList.remove("printing-preview");
      delete document.body.dataset.printScope;
      delete document.body.dataset.printOrient;
      style.remove();
    };
  }, [open, scope, orient]);

  useEffect(() => {
    if (open) setPage(0);
  }, [open, lines.length, orient]);

  useLayoutEffect(() => {
    if (!printReady) return;
    const id = requestAnimationFrame(() => {
      window.print();
      setPrintReady(false);
    });
    return () => cancelAnimationFrame(id);
  }, [printReady]);

  function toggleCol(id: ColId) {
    if (onToggleCol) onToggleCol(id);
    else onColsChange(toggleRegisterCol(cols, id));
  }

  function printNow() {
    document.body.dataset.printScope = scope;
    document.body.dataset.printOrient = orient;
    setPrintReady(true);
  }

  const sheetProps = {
    companyName,
    companyAddress: companyAddress ?? "",
    companyPhone: companyPhone ?? "",
    companyEmail: companyEmail ?? "",
    bankLabel,
    pageCount,
    banks,
    currency,
    fontSize: fontSize ?? 12,
    grandOut,
    grandIn,
    grandLast,
    scope,
    orient,
    cols,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="print-preview-dialog no-print flex max-w-5xl flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>Print preview</DialogTitle>
            <DialogDescription>
              One paper-shaped page on screen. Hide columns, then Print / Save PDF — the browser dialog is how you save a PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-2 flex shrink-0 flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Seg
                label="Print range"
                value={scope}
                onChange={setScope}
                options={[
                  { id: "one", label: "This page" },
                  { id: "all", label: "All pages" },
                ]}
              />
              <Seg
                label="Page orientation"
                value={orient}
                onChange={setOrient}
                options={[
                  { id: "portrait", label: "Portrait" },
                  { id: "landscape", label: "Landscape" },
                ]}
              />
              <div className="flex items-center gap-1 sm:ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-10 min-w-10"
                  disabled={current <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-16 text-center text-sm tabular-nums">
                  {current + 1} / {pageCount}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-10 min-w-10"
                  disabled={current >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
            <ColumnChips
              cols={cols}
              onToggle={toggleCol}
              onShowAll={() => onColsChange({ ...DEFAULT_REGISTER_COLS })}
            />
          </div>

          <div className="print-pdf-stage">
            <figure className="print-preview-figure" data-preview-page={current} data-current="true">
              <PrintPage current page={current + 1} lines={pages[current] ?? []} {...sheetProps} />
              <figcaption className="print-preview-caption">
                Page {current + 1} of {pageCount}
                {scope === "all" ? " · printing every page" : " · printing this page"}
              </figcaption>
            </figure>
          </div>

          <DialogFooter className="mt-3 shrink-0">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={printNow} disabled={shownCount === 0}>
              <Printer />
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {mounted && open && printReady
        ? createPortal(
            <div className="print-root" data-orient={orient} aria-hidden="true">
              {printIndexes.map((index) => (
                <PrintPage
                  key={index}
                  current={index === current}
                  page={index + 1}
                  lines={pages[index] ?? []}
                  {...sheetProps}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function Seg<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex w-fit rounded-xl bg-muted p-1" role="group" aria-label={label}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          className={cn(
            "inline-flex h-10 min-h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground",
            value === opt.id && "bg-card text-foreground elevation",
          )}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PrintPage({
  current,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  bankLabel,
  page,
  pageCount,
  lines,
  banks,
  currency,
  fontSize,
  grandOut,
  grandIn,
  grandLast,
  scope,
  orient,
  cols,
}: {
  current: boolean;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  bankLabel: string;
  page: number;
  pageCount: number;
  lines: BalancedCashLine[];
  banks: { id: string; nickname: string }[];
  currency: string;
  fontSize: number;
  grandOut: number;
  grandIn: number;
  grandLast: number;
  scope: Scope;
  orient: Orient;
  cols: RegisterCols;
}) {
  const outTotal = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.payment, 0);
  const inTotal = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.deposit, 0);
  const lastBalance = lines.at(-1)?.balance ?? 0;
  const showGrand = scope === "all" && page === pageCount;
  const visible = REGISTER_COLS.filter((c) => cols[c.id]);
  const lead = visible.findIndex((c) => c.id === "payment" || c.id === "deposit" || c.id === "balance");
  const labelSpan = lead === -1 ? visible.length : lead;
  const contact = [companyPhone, companyEmail].filter(Boolean).join(" · ");

  return (
    <article
      className="print-sheet"
      data-current={current ? "true" : undefined}
      data-orient={orient}
      style={{ ["--register-font" as string]: `${fontSize}px` }}
    >
      <div className="register-print-head">
        <p className="print-company">{companyName}</p>
        {companyAddress ? <p>{companyAddress}</p> : null}
        {contact ? <p>{contact}</p> : null}
        <h1>Bank Register</h1>
        <p>
          {bankLabel} · {formatDate(todayIso())} · Page {page} of {pageCount}
        </p>
      </div>
      {lines.length === 0 || visible.length === 0 ? (
        <p className="print-sheet-empty">Nothing to print for these filters.</p>
      ) : (
        <table className="register-print-table">
          <thead>
            <tr>
              {visible.map((col) => (
                <th key={col.id} className={REGISTER_COL_CLASS[col.id]}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const bank = banks.find((b) => b.id === line.bankId);
              return (
                <tr key={line.id}>
                  {visible.map((col) => (
                    <td key={col.id} className={REGISTER_COL_CLASS[col.id]}>
                      {renderCell(col.id, line, bank?.nickname ?? "", currency)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          {cols.payment || cols.deposit || cols.balance ? (
            <tfoot>
              <tr>
                {visible.map((col, i) => {
                  if (labelSpan > 0 && i === 0) {
                    return (
                      <td key="label" colSpan={labelSpan}>
                        {showGrand ? "Totals" : "This page"}
                      </td>
                    );
                  }
                  if (labelSpan > 0 && i < labelSpan) return null;
                  if (col.id === "payment") {
                    return (
                      <td key={col.id} className={`${REGISTER_COL_CLASS.payment} num`}>
                        <Money amount={showGrand ? grandOut : outTotal} currency={currency} className="text-debit" />
                      </td>
                    );
                  }
                  if (col.id === "deposit") {
                    return (
                      <td key={col.id} className={`${REGISTER_COL_CLASS.deposit} num`}>
                        <Money amount={showGrand ? grandIn : inTotal} currency={currency} className="text-credit" />
                      </td>
                    );
                  }
                  if (col.id === "balance") {
                    return (
                      <td key={col.id} className={`${REGISTER_COL_CLASS.balance} num`}>
                        <Money amount={showGrand ? grandLast : lastBalance} currency={currency} />
                      </td>
                    );
                  }
                  return <td key={col.id} className={REGISTER_COL_CLASS[col.id]} />;
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      )}
    </article>
  );
}

function renderCell(id: ColId, line: BalancedCashLine, bank: string, currency: string) {
  if (id === "date") return line.kind === "opening" && !line.date ? "Opening" : formatDate(line.date);
  if (id === "type") return KIND_LABEL[line.kind];
  if (id === "number") return line.number || "—";
  if (id === "payee") return <span className="font-medium">{line.party}</span>;
  if (id === "memo") return line.memo || "—";
  if (id === "bank") return bank || "—";
  if (id === "payment") return line.payment ? <Money amount={line.payment} currency={currency} className="text-debit" /> : "—";
  if (id === "deposit") return line.deposit ? <Money amount={line.deposit} currency={currency} className="text-credit" /> : "—";
  if (id === "balance") return <Money amount={line.balance} currency={currency} />;
  if (id === "status") return <PrintStatus line={line} />;
  return null;
}
