import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Money } from "@/components/money";
import { CheckBadge, ReceiptBadge, ReconBadge, StatusLabel } from "@/components/status-badge";
import { formatDate, todayIso } from "@/lib/finance/format";
import { KIND_LABEL, type BalancedCashLine, type CashLine } from "@/lib/finance/register";
import { REGISTER_COL_CLASS, REGISTER_COLS, type RegisterColId, type RegisterCols } from "@/lib/finance/types";

export type PrintOrient = "portrait" | "landscape";
export type PrintPaper =
  | "letter"
  | "legal"
  | "tabloid"
  | "statement"
  | "executive"
  | "folio"
  | "a3"
  | "a4"
  | "a5"
  | "b4"
  | "b5";
export type PrintScale = "fit" | number;
export type PrintViewZoom = "fit" | number;
export type PageRange = { from: number; to: number };

const ORIENT_KEY = "finance-manager-print-orient";
const PAPER_KEY = "finance-manager-print-paper";
const SCALE_KEY = "finance-manager-print-scale";
const SCALE_LAST_KEY = "finance-manager-print-scale-last";
const VIEW_ZOOM_KEY = "finance-manager-print-view-zoom";
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const TYPE_MIN = 40;
const TYPE_MAX = 150;
const TYPE_DEFAULT = 80;
const MARGIN = { top: 0.5, right: 0.5, bottom: 0.65, left: 0.5 };
const RANGE_ALL: PageRange = { from: 1, to: Number.MAX_SAFE_INTEGER };

const PAPER_SPEC: Record<PrintPaper, { short: number; long: number; unit: "in" | "mm"; label: string; group: "US" | "ISO" }> = {
  letter: { short: 8.5, long: 11, unit: "in", label: "Letter", group: "US" },
  legal: { short: 8.5, long: 14, unit: "in", label: "Legal", group: "US" },
  tabloid: { short: 11, long: 17, unit: "in", label: "Tabloid", group: "US" },
  statement: { short: 5.5, long: 8.5, unit: "in", label: "Statement", group: "US" },
  executive: { short: 7.25, long: 10.5, unit: "in", label: "Executive", group: "US" },
  folio: { short: 8.5, long: 13, unit: "in", label: "Folio", group: "US" },
  a3: { short: 297, long: 420, unit: "mm", label: "A3", group: "ISO" },
  a4: { short: 210, long: 297, unit: "mm", label: "A4", group: "ISO" },
  a5: { short: 148, long: 210, unit: "mm", label: "A5", group: "ISO" },
  b4: { short: 250, long: 353, unit: "mm", label: "B4", group: "ISO" },
  b5: { short: 176, long: 250, unit: "mm", label: "B5", group: "ISO" },
};

const US_PAPERS: PrintPaper[] = ["letter", "legal", "tabloid", "statement", "executive", "folio"];
const ISO_PAPERS: PrintPaper[] = ["a3", "a4", "a5", "b4", "b5"];

export type PrintLayout = {
  orient: PrintOrient;
  paper: PrintPaper;
  scale: PrintScale;
  viewZoom: PrintViewZoom;
};

function isPrintPaper(v: string | null): v is PrintPaper {
  return v != null && v in PAPER_SPEC;
}

function readOrient(): PrintOrient {
  try {
    return localStorage.getItem(ORIENT_KEY) === "landscape" ? "landscape" : "portrait";
  } catch {
    return "portrait";
  }
}

function readPaper(): PrintPaper {
  try {
    const v = localStorage.getItem(PAPER_KEY);
    if (isPrintPaper(v)) return v;
  } catch {
    /* ignore */
  }
  return "letter";
}

function clampType(n: number) {
  return Math.min(TYPE_MAX, Math.max(TYPE_MIN, Math.round(n)));
}

/** Type % that usually fits this paper without Fit-type squeezing. Never 100 — that has its own button. */
function suggestedType(orient: PrintOrient, paper: PrintPaper): number {
  const box = pageBox(orient, paper);
  const wIn = box.unit === "mm" ? box.w / 25.4 : box.w;
  const usable = Math.max(3, wIn - MARGIN.left - MARGIN.right);
  const n = clampType(Math.round(((usable / 10) * 100) / 5) * 5);
  return n >= 100 ? 90 : n;
}

function parseTypeInput(raw: string): number | null {
  const t = raw.trim().replace(/%/g, "");
  if (t === "") return null;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return clampType(n);
}

function readLastType(): number {
  try {
    const v = localStorage.getItem(SCALE_LAST_KEY);
    if (v == null || v === "") return TYPE_DEFAULT;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return clampType(n);
  } catch {
    /* ignore */
  }
  return TYPE_DEFAULT;
}

function readScale(): PrintScale {
  try {
    const v = localStorage.getItem(SCALE_KEY);
    if (v === "fit" || v === null) return "fit";
    const n = Number(v);
    if (Number.isFinite(n)) return clampType(n);
  } catch {
    /* ignore */
  }
  return "fit";
}

function readViewZoom(): PrintViewZoom {
  try {
    const v = localStorage.getItem(VIEW_ZOOM_KEY);
    if (v === "fit" || v === null) return "fit";
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0.25 && n <= 3) return n;
  } catch {
    /* ignore */
  }
  return "fit";
}

function readLayout(): PrintLayout {
  return { orient: readOrient(), paper: readPaper(), scale: readScale(), viewZoom: readViewZoom() };
}

let rangeState: PageRange = { ...RANGE_ALL };

function readRange(): PageRange {
  return rangeState;
}

export function pageBox(orient: PrintOrient, paper: PrintPaper) {
  const spec = PAPER_SPEC[paper];
  const land = orient === "landscape";
  return {
    w: land ? spec.long : spec.short,
    h: land ? spec.short : spec.long,
    unit: spec.unit,
    paperLabel: spec.label,
    orientLabel: land ? "Landscape" : "Portrait",
  };
}

function pageWidthPx(orient: PrintOrient, paper: PrintPaper) {
  const box = pageBox(orient, paper);
  return box.unit === "mm" ? (box.w / 25.4) * 96 : box.w * 96;
}

function pageHeightPx(orient: PrintOrient, paper: PrintPaper) {
  const box = pageBox(orient, paper);
  return box.unit === "mm" ? (box.h / 25.4) * 96 : box.h * 96;
}

function printableHeightPx(orient: PrintOrient, paper: PrintPaper) {
  return Math.max(48, pageHeightPx(orient, paper) - (MARGIN.top + MARGIN.bottom) * 96);
}

function paperDim(id: PrintPaper) {
  const spec = PAPER_SPEC[id];
  return spec.unit === "in" ? `${spec.short}" × ${spec.long}"` : `${spec.short} × ${spec.long} mm`;
}

function contactLine(address?: string, phone?: string) {
  const addr = (address ?? "").replace(/\s*\n+\s*/g, " · ").trim();
  return [addr || null, phone || null].filter(Boolean).join(" · ");
}

export function PrintLetterhead({
  title,
  subtitle,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
}: {
  title: string;
  subtitle?: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}) {
  const loc = contactLine(companyAddress, companyPhone);
  return (
    <header className="print-letterhead">
      <div className="print-letterhead-row">
        <p className="print-company">{companyName}</p>
        <div className="print-letterhead-what">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {loc ? <p className="print-letterhead-meta">{loc}</p> : null}
      {companyEmail ? <p className="print-letterhead-email">{companyEmail}</p> : null}
    </header>
  );
}

function pageSizeCss(orient: PrintOrient, paper: PrintPaper): string {
  const box = pageBox(orient, paper);
  return `${box.w}${box.unit} ${box.h}${box.unit}`;
}

function applyPageSize(layout: PrintLayout = readLayout()) {
  if (typeof document === "undefined") return;
  const box = pageBox(layout.orient, layout.paper);
  const type = layout.scale === "fit" ? 1 : layout.scale / 100;
  document.body.dataset.printOrient = layout.orient;
  document.body.dataset.printPaper = layout.paper;
  document.body.dataset.printScale = String(layout.scale);
  document.body.style.setProperty("--print-page-w", `${box.w}${box.unit}`);
  document.body.style.setProperty("--print-page-h", `${box.h}${box.unit}`);
  document.body.style.setProperty("--print-margin-t", `${MARGIN.top}in`);
  document.body.style.setProperty("--print-margin-r", `${MARGIN.right}in`);
  document.body.style.setProperty("--print-margin-b", `${MARGIN.bottom}in`);
  document.body.style.setProperty("--print-margin-l", `${MARGIN.left}in`);
  document.documentElement.style.setProperty("--print-type", String(type));
  document.body.style.setProperty("--print-type", String(type));
  let style = document.getElementById("print-page-size");
  if (!style) {
    style = document.createElement("style");
    style.id = "print-page-size";
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${pageSizeCss(layout.orient, layout.paper)}; margin: ${MARGIN.top}in ${MARGIN.right}in ${MARGIN.bottom}in ${MARGIN.left}in; }
@media print {
  html, body, .print-root, .print-desk, .print-paper-stack {
    background: white !important;
    box-shadow: none !important;
    zoom: 1 !important;
  }
  .print-paper-stack { zoom: 1 !important; }
  .print-root { zoom: 1 !important; }
  .print-page-window { transform: none !important; }
  .print-sheet, body.printing .print-sheet {
    font-size: calc(var(--register-font, 12px) * ${type}) !important;
    padding: 0 !important;
  }
  .print-measure,
  .print-printable,
  .print-guide-layer,
  .print-stage-bar,
  .print-desk { box-shadow: none !important; }
  .print-page-card { box-shadow: none !important; outline: none !important; border: none !important; }
}`;
}

const previewSubs = new Set<() => void>();
const DEFAULT_LAYOUT: PrintLayout = { orient: "portrait", paper: "letter", scale: "fit", viewZoom: "fit" };
let layoutSnapshot: PrintLayout = DEFAULT_LAYOUT;
let lastFitScale = 1;
let printingSnap = false;

function notifyPreview() {
  previewSubs.forEach((fn) => fn());
}

function setPrinting(on: boolean) {
  if (printingSnap === on) return;
  printingSnap = on;
  notifyPreview();
}

function usePrinting() {
  return useSyncExternalStore(subscribePreview, () => printingSnap, () => false);
}

function snapshotLayout(): PrintLayout {
  const next = readLayout();
  const prev = layoutSnapshot;
  if (
    prev.orient === next.orient &&
    prev.paper === next.paper &&
    prev.scale === next.scale &&
    prev.viewZoom === next.viewZoom
  ) {
    return prev;
  }
  layoutSnapshot = next;
  return next;
}

function subscribePreview(cb: () => void) {
  previewSubs.add(cb);
  return () => {
    previewSubs.delete(cb);
  };
}

export function usePrintLayout(): PrintLayout {
  return useSyncExternalStore(subscribePreview, snapshotLayout, () => DEFAULT_LAYOUT);
}

function snapshotRange(): PageRange {
  return rangeState;
}

function usePrintRange(): [PageRange, (range: PageRange) => void] {
  const range = useSyncExternalStore(subscribePreview, snapshotRange, () => RANGE_ALL);
  return [
    range,
    (next) => {
      if (rangeState.from === next.from && rangeState.to === next.to) return;
      rangeState = next;
      notifyPreview();
    },
  ];
}

function persistLayout(next: Partial<PrintLayout>) {
  try {
    if (next.orient) localStorage.setItem(ORIENT_KEY, next.orient);
    if (next.paper) localStorage.setItem(PAPER_KEY, next.paper);
    if (next.scale !== undefined) {
      localStorage.setItem(SCALE_KEY, String(next.scale));
      if (typeof next.scale === "number") localStorage.setItem(SCALE_LAST_KEY, String(next.scale));
    }
    if (next.viewZoom !== undefined) {
      localStorage.setItem(VIEW_ZOOM_KEY, String(next.viewZoom));
    }
  } catch {
    /* ignore */
  }
  applyPageSize(snapshotLayout());
  notifyPreview();
}

export function setPrintOrient(orient: PrintOrient) {
  persistLayout({ orient });
}

export function setPrintPaper(paper: PrintPaper) {
  persistLayout({ paper });
}

export function setPrintScale(scale: PrintScale) {
  persistLayout({ scale });
}

export function setPrintViewZoom(viewZoom: PrintViewZoom) {
  persistLayout({ viewZoom });
}

export function getPrintOrient(): PrintOrient {
  return readOrient();
}

function PrintStatus({ line }: { line: CashLine }) {
  if (line.kind === "opening") return null;
  if (line.kind === "check" && (line.status === "voided" || line.status === "bounced")) {
    return <CheckBadge status={line.status as "voided" | "bounced"} />;
  }
  if ((line.kind === "receipt" || line.kind === "payment") && line.status === "void") {
    return <ReceiptBadge status="void" />;
  }
  if (line.recon) return <ReconBadge recon={line.recon} />;
  if (!line.status) return null;
  return <StatusLabel status={line.status} />;
}

export function closePrintPreview() {
  document.body.classList.remove("print-preview", "printing");
  setPrinting(false);
  notifyPreview();
}

export function nativePrint() {
  applyPageSize();
  setPrinting(true);
  document.body.classList.add("printing");
  document.body.classList.remove("print-preview");
  const restore = () => {
    setPrinting(false);
    document.body.classList.remove("printing");
    document.body.classList.add("print-preview");
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        window.print();
      } catch {
        restore();
      }
    });
  });
}

/** Opens the on-screen sheet. System print is a second click — window.print is blocked in this preview. */
export function requestPrint() {
  rangeState = { ...RANGE_ALL };
  applyPageSize();
  document.body.classList.add("print-preview");
  notifyPreview();
}

function ToolGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="print-tool-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}

function nearestStep(value: number, dir: 1 | -1) {
  if (dir > 0) {
    return ZOOM_STEPS.find((s) => s > value + 0.01) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  }
  const below = [...ZOOM_STEPS].reverse().find((s) => s < value - 0.01);
  return below ?? ZOOM_STEPS[0];
}

function bumpViewZoom(current: number, dir: 1 | -1) {
  setPrintViewZoom(nearestStep(current, dir));
}

function parsePageInput(raw: string, total: number): number | null {
  const t = raw.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  const max = Math.max(1, total);
  return Math.min(max, Math.max(1, Math.trunc(n)));
}

function normalizeRange(from: number, to: number, total: number): PageRange {
  const max = Math.max(1, total);
  const a = Math.min(max, Math.max(1, Math.trunc(from) || 1));
  const b = Math.min(max, Math.max(1, Math.trunc(to) || max));
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

function isSentinelAll(range: PageRange) {
  return range.to >= RANGE_ALL.to / 2;
}

function shownRange(range: PageRange, total: number): PageRange {
  if (isSentinelAll(range)) return { from: 1, to: Math.max(1, total) };
  return normalizeRange(range.from, range.to, total);
}

function currentVisiblePage(total: number): number {
  const max = Math.max(1, total);
  const desk = document.querySelector(".print-desk");
  if (!(desk instanceof HTMLElement)) return 1;
  const cards = desk.querySelectorAll<HTMLElement>(".print-page-card[data-print-keep='1']");
  if (cards.length === 0) return 1;
  const target = desk.getBoundingClientRect().top + 12;
  let best = 1;
  cards.forEach((el) => {
    const page = Number(el.dataset.page);
    if (!Number.isFinite(page)) return;
    if (el.getBoundingClientRect().top <= target + 48) best = page;
  });
  return Math.min(max, Math.max(1, best));
}

export function PrintToolbar({ viewPercent, pageCount }: { viewPercent?: number; pageCount: number }) {
  const layout = usePrintLayout();
  const [range, setRange] = usePrintRange();
  const box = pageBox(layout.orient, layout.paper);
  const suggest = suggestedType(layout.orient, layout.paper);
  const sizeLabel = `${box.w}${box.unit === "in" ? '"' : "mm"} × ${box.h}${box.unit === "in" ? '"' : "mm"}`;
  const zoomLabel =
    layout.viewZoom === "fit"
      ? `Fit ${viewPercent ? Math.round(viewPercent) : "—"}%`
      : `${Math.round(layout.viewZoom * 100)}%`;
  const current = layout.viewZoom === "fit" ? (viewPercent ?? 100) / 100 : layout.viewZoom;
  const shown = shownRange(range, pageCount);
  const isAll = isSentinelAll(range) || (shown.from === 1 && shown.to === pageCount);
  const [fromDraft, setFromDraft] = useState(String(shown.from));
  const [toDraft, setToDraft] = useState(String(shown.to));
  const [fromError, setFromError] = useState(false);
  const [toError, setToError] = useState(false);
  const shownType = typeof layout.scale === "number" ? layout.scale : null;
  const [typeDraft, setTypeDraft] = useState(shownType == null ? "" : String(shownType));
  const customOn = typeof layout.scale === "number";

  useEffect(() => {
    setFromDraft(String(shown.from));
    setToDraft(String(shown.to));
    setFromError(false);
    setToError(false);
  }, [shown.from, shown.to, pageCount]);

  useEffect(() => {
    setTypeDraft(shownType == null ? "" : String(shownType));
  }, [shownType]);

  function commitRange(nextFrom = fromDraft, nextTo = toDraft) {
    const fromRaw = nextFrom.trim();
    const toRaw = nextTo.trim();
    const a = parsePageInput(nextFrom, pageCount);
    const b = parsePageInput(nextTo, pageCount);
    const fromBad = fromRaw !== "" && a == null;
    const toBad = toRaw !== "" && b == null;
    if (a == null && b == null) {
      setFromError(fromBad);
      setToError(toBad);
      setFromDraft(String(shown.from));
      setToDraft(String(shown.to));
      return shown;
    }
    const next = normalizeRange(a ?? shown.from, b ?? shown.to, pageCount);
    setRange(next);
    setFromDraft(String(next.from));
    setToDraft(String(next.to));
    setFromError(fromBad);
    setToError(toBad);
    return next;
  }

  function commitType(raw = typeDraft) {
    const t = raw.trim();
    if (t === "") {
      setTypeDraft("");
      if (layout.scale !== "fit") setPrintScale("fit");
      return "fit" as PrintScale;
    }
    const n = parseTypeInput(raw);
    if (n == null) {
      setTypeDraft(shownType == null ? "" : String(shownType));
      return layout.scale;
    }
    setTypeDraft(String(n));
    if (layout.scale === n) return n;
    setPrintScale(n);
    return n;
  }

  return (
    <div className="print-stage-bar no-print" role="toolbar" aria-label="Print">
      <div className="print-stage-top">
        <p className="print-stage-status">
          <span className="print-status-full">
            {box.paperLabel} {box.orientLabel.toLowerCase()} · {sizeLabel} · {pageCount}{" "}
            {pageCount === 1 ? "page" : "pages"}
            {layout.scale === "fit" ? " · fit columns" : ` · type ${layout.scale}%`}
            <span className="print-stage-hint"> · camera zoom does not print</span>
          </span>
          <span className="print-status-short">
            {box.paperLabel} · {pageCount}p{layout.scale === "fit" ? " · fit" : ` · ${layout.scale}%`}
          </span>
        </p>
        <div className="print-stage-actions">
          <Button size="sm" variant="outline" onClick={closePrintPreview}>
            <X />
            Close
          </Button>
          <Button
            size="sm"
            onClick={() => {
              commitRange();
              commitType();
              nativePrint();
            }}
          >
            <Printer />
            <span className="print-action-full">System print</span>
            <span className="print-action-short">Print</span>
          </Button>
        </div>
      </div>
      <div className="print-stage-tools">
      <ToolGroup label="Orientation">
        <Button size="sm" variant={layout.orient === "portrait" ? "default" : "outline"} aria-pressed={layout.orient === "portrait"} onClick={() => setPrintOrient("portrait")}>
          <span className="print-label-full">Portrait</span>
          <span className="print-label-short">Port.</span>
        </Button>
        <Button size="sm" variant={layout.orient === "landscape" ? "default" : "outline"} aria-pressed={layout.orient === "landscape"} onClick={() => setPrintOrient("landscape")}>
          <span className="print-label-full">Landscape</span>
          <span className="print-label-short">Land.</span>
        </Button>
      </ToolGroup>
      <ToolGroup label="Paper">
        <Select value={layout.paper} onValueChange={(v) => setPrintPaper(v as PrintPaper)}>
          <SelectTrigger className="print-paper-select h-8 min-h-8 w-[8.5rem] px-2 text-xs" aria-label="Paper size">
            <SelectValue placeholder="Paper" />
          </SelectTrigger>
          <SelectContent className="print-paper-menu" position="popper" side="bottom" align="start" style={{ zIndex: 400 }}>
            <SelectGroup>
              <SelectLabel>US</SelectLabel>
              {US_PAPERS.map((id) => (
                <SelectItem key={id} value={id} hint={`— ${paperDim(id)}`}>
                  {PAPER_SPEC[id].label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>ISO</SelectLabel>
              {ISO_PAPERS.map((id) => (
                <SelectItem key={id} value={id} hint={`— ${paperDim(id)}`}>
                  {PAPER_SPEC[id].label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </ToolGroup>
      <ToolGroup label="Pages">
        <Button
          size="sm"
          variant={isAll ? "default" : "outline"}
          aria-pressed={isAll}
          onClick={() => {
            setRange({ ...RANGE_ALL });
            setFromDraft("1");
            setToDraft(String(pageCount));
            setFromError(false);
            setToError(false);
          }}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={!isAll && shown.from === shown.to ? "default" : "outline"}
          aria-pressed={!isAll && shown.from === shown.to}
          onClick={() => {
            const p = currentVisiblePage(pageCount);
            const next = { from: p, to: p };
            setRange(next);
            setFromDraft(String(p));
            setToDraft(String(p));
            setFromError(false);
            setToError(false);
          }}
        >
          This
        </Button>
        <input
          className="print-page-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          spellCheck={false}
          aria-label="From page"
          aria-invalid={fromError}
          value={fromDraft}
          onChange={(e) => {
            setFromDraft(e.target.value.replace(/[^\d]/g, ""));
            setFromError(false);
          }}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => commitRange()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitRange();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
        />
        <span className="print-page-dash">–</span>
        <input
          className="print-page-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          spellCheck={false}
          aria-label="To page"
          aria-invalid={toError}
          value={toDraft}
          onChange={(e) => {
            setToDraft(e.target.value.replace(/[^\d]/g, ""));
            setToError(false);
          }}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => commitRange()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitRange();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
        />
        <span className="print-page-total">of {pageCount}</span>
      </ToolGroup>
      <ToolGroup label="On paper">
        <Button size="sm" variant={layout.scale === "fit" ? "default" : "outline"} aria-pressed={layout.scale === "fit"} onClick={() => { setTypeDraft(""); setPrintScale("fit"); }} title="Full size type from View — squeeze columns onto the page">
          <span className="print-label-full">Fit type</span>
          <span className="print-label-short">Fit</span>
        </Button>
        <Button size="sm" className="print-type-preset" variant={layout.scale === 100 ? "default" : "outline"} aria-pressed={layout.scale === 100} onClick={() => setPrintScale(100)} title="Print at View type size — packs as many lines as that size allows">
          100%
        </Button>
        <Button
          size="sm"
          className="print-type-preset"
          variant={layout.scale === suggest ? "default" : "outline"}
          aria-pressed={layout.scale === suggest}
          title={`Smaller type (${suggest}%) packs more register lines on ${box.paperLabel} ${box.orientLabel.toLowerCase()}`}
          aria-label={`Suggested type ${suggest} percent`}
          onClick={() => setPrintScale(suggest)}
        >
          {suggest}%
        </Button>
        <input
          className="print-page-input print-type-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          autoComplete="off"
          spellCheck={false}
          placeholder="Fit"
          aria-label="Type size percent — smaller type fits more lines on the page"
          aria-pressed={customOn}
          value={typeDraft}
          onChange={(e) => {
            const d = e.target.value.replace(/[^\d]/g, "");
            if (d === "") {
              setTypeDraft("");
              return;
            }
            const n = Number(d);
            setTypeDraft(n > TYPE_MAX ? String(TYPE_MAX) : d);
          }}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={() => commitType()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitType();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
        />
        <span className="print-page-total">%</span>
      </ToolGroup>
      <ToolGroup label="Preview zoom">
        <Button size="sm" variant={layout.viewZoom === "fit" ? "default" : "outline"} aria-pressed={layout.viewZoom === "fit"} onClick={() => setPrintViewZoom("fit")} title="Fit one whole page in the window — camera only, not printed">
          <span className="print-label-full">Fit view</span>
          <span className="print-label-short">View</span>
        </Button>
        <Button size="sm" variant="outline" aria-label="Zoom out" disabled={current <= ZOOM_STEPS[0]} onClick={() => bumpViewZoom(current, -1)}>
          <Minus />
        </Button>
        <span className="print-zoom-readout" aria-live="polite">
          <span className="print-label-full">{zoomLabel}</span>
          <span className="print-label-short">{layout.viewZoom === "fit" ? (viewPercent ? `${Math.round(viewPercent)}%` : "Fit") : `${Math.round(layout.viewZoom * 100)}%`}</span>
        </span>
        <Button
          size="sm"
          variant="outline"
          aria-label="Zoom in"
          disabled={current >= ZOOM_STEPS[ZOOM_STEPS.length - 1] && layout.viewZoom !== "fit"}
          onClick={() => bumpViewZoom(current, 1)}
        >
          <Plus />
        </Button>
      </ToolGroup>
      </div>
    </div>
  );
}

const PREVIEW_PAD = 1;

function PagedSheets({
  children,
  startPage,
  total,
  onCount,
}: {
  children: ReactNode;
  startPage: number;
  total: number;
  onCount: (n: number) => void;
}) {
  const layout = usePrintLayout();
  const printing = usePrinting();
  const [range] = usePrintRange();
  const measureRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(1);
  const [liveFrom, setLiveFrom] = useState(1);
  const [liveTo, setLiveTo] = useState(1 + PREVIEW_PAD);
  const innerH = printableHeightPx(layout.orient, layout.paper);
  const shown = shownRange(range, total);
  const onCountRef = useRef(onCount);
  onCountRef.current = onCount;

  useLayoutEffect(() => {
    const node = measureRef.current;
    if (!node) return;
    const root: HTMLDivElement = node;
    let raf = 0;
    function measure() {
      const h = Math.max(1, root.scrollHeight);
      const n = Math.max(1, Math.ceil(h / innerH - 0.02));
      setCount((c) => (c === n ? c : n));
      onCountRef.current(n);
    }
    measure();
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    });
    ro.observe(root);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [innerH, layout.scale, layout.orient, layout.paper]);

  useEffect(() => {
    if (printing) return;
    const node = document.querySelector(".print-desk");
    if (!(node instanceof HTMLElement)) return;
    const desk: HTMLElement = node;
    function sync() {
      const cards = desk.querySelectorAll<HTMLElement>("[data-page]");
      if (cards.length === 0) return;
      const view = desk.getBoundingClientRect();
      let from = Number.POSITIVE_INFINITY;
      let to = 0;
      cards.forEach((el) => {
        const page = Number(el.dataset.page);
        if (!Number.isFinite(page)) return;
        const r = el.getBoundingClientRect();
        if (r.bottom >= view.top - 80 && r.top <= view.bottom + 80) {
          from = Math.min(from, page);
          to = Math.max(to, page);
        }
      });
      if (!Number.isFinite(from)) return;
      setLiveFrom((v) => (v === from ? v : from));
      setLiveTo((v) => (v === to ? v : to));
    }
    sync();
    desk.addEventListener("scroll", sync, { passive: true });
    return () => desk.removeEventListener("scroll", sync);
  }, [printing, count, startPage, layout.orient, layout.paper]);

  const child: ReactElement = isValidElement(children) ? children : <article className="print-sheet">{children}</article>;
  const pages: Array<{ page: number; live: boolean }> = [];
  let lastKeep = startPage - 1;
  for (let i = 0; i < count; i++) {
    const page = startPage + i;
    if (page < shown.from || page > shown.to) continue;
    lastKeep = page;
    const live = printing || (page >= liveFrom - PREVIEW_PAD && page <= liveTo + PREVIEW_PAD);
    pages.push({ page, live });
  }

  return (
    <>
      {createPortal(
        <div className="print-measure no-print" ref={measureRef} aria-hidden="true">
          {child}
        </div>,
        document.body,
      )}
      {pages.map(({ page, live }) => {
        const i = page - startPage;
        if (!live) {
          return (
            <article
              key={page}
              className="print-page-card print-page-stub"
              data-page={page}
              data-print-keep="1"
              aria-hidden
            />
          );
        }
        return (
          <article
            key={page}
            className="print-page-card"
            data-page={page}
            data-print-keep="1"
            data-last={page === lastKeep ? "1" : "0"}
            style={{ ["--print-shift" as string]: `calc(${-i} * (var(--print-page-h) - 0.5in - 0.65in))` }}
          >
            <div className="print-page-window">
              <div className="print-page-shift">{cloneElement(child)}</div>
            </div>
            <span className="print-printable no-print" aria-hidden="true" />
            <span className="print-page-num">
              {page} / {total}
            </span>
          </article>
        );
      })}
    </>
  );
}

export function PrintFrame({ children }: { children: ReactNode }) {
  const layout = usePrintLayout();
  const deskRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef(1);
  const [fitScale, setFitScale] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const childList = Children.toArray(children);

  const reportCount = useCallback((id: string, n: number) => {
    setCounts((c) => (c[id] === n ? c : { ...c, [id]: n }));
  }, []);

  const offsets: number[] = [];
  let running = 1;
  for (let i = 0; i < childList.length; i++) {
    offsets.push(running);
    running += counts[String(i)] ?? 1;
  }
  const pageCount = Math.max(1, running - 1);

  useEffect(() => {
    applyPageSize(layout);
    function beforePrint() {
      setPrinting(true);
      document.body.classList.add("printing");
      document.body.classList.remove("print-preview");
      applyPageSize(readLayout());
    }
    function afterPrint() {
      setPrinting(false);
      document.body.classList.remove("printing");
      document.body.classList.add("print-preview");
    }
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove("printing");
      setPrinting(false);
    };
  }, [layout.orient, layout.paper, layout.scale]);

  useLayoutEffect(() => {
    const node = deskRef.current;
    if (!node) return;
    const desk: HTMLDivElement = node;
    function measure() {
      const pad = desk.clientWidth < 480 ? 16 : 40;
      const w = Math.max(120, desk.clientWidth - pad);
      const h = Math.max(120, desk.clientHeight - pad);
      const pageW = pageWidthPx(layout.orient, layout.paper);
      const pageH = pageHeightPx(layout.orient, layout.paper);
      const next = Math.max(0.2, Math.min(w / pageW, h / pageH));
      fitRef.current = next;
      lastFitScale = next;
      setFitScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next));
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(desk);
    return () => ro.disconnect();
  }, [layout.orient, layout.paper]);

  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const layoutNow = readLayout();
      const current = layoutNow.viewZoom === "fit" ? fitRef.current : layoutNow.viewZoom;
      bumpViewZoom(current, e.deltaY < 0 ? 1 : -1);
    }
    desk.addEventListener("wheel", onWheel, { passive: false });
    return () => desk.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (isSentinelAll(rangeState)) return;
    const next = normalizeRange(rangeState.from, rangeState.to, pageCount);
    if (next.from !== rangeState.from || next.to !== rangeState.to) {
      rangeState = next;
      notifyPreview();
    }
  }, [pageCount]);

  const zoom = layout.viewZoom === "fit" ? fitScale : layout.viewZoom;
  const type = layout.scale === "fit" ? 1 : layout.scale / 100;

  return (
    <div className="print-root" style={{ ["--print-type" as string]: String(type) }}>
      <PrintToolbar viewPercent={zoom * 100} pageCount={pageCount} />
      <div className="print-desk" ref={deskRef}>
        <div className="print-paper-stack" style={{ ["--print-preview-zoom" as string]: String(zoom) }}>
          {childList.map((child, i) => (
            <PagedSheets
              key={i}
              startPage={offsets[i] ?? 1}
              total={pageCount}
              onCount={(n) => reportCount(String(i), n)}
            >
              {child}
            </PagedSheets>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PrintStage() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!document.body.classList.contains("print-preview")) return;
      if (e.key === "Escape") {
        closePrintPreview();
        return;
      }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setPrintViewZoom("fit");
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const layout = readLayout();
        const current = layout.viewZoom === "fit" ? lastFitScale : layout.viewZoom;
        bumpViewZoom(current, 1);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        const layout = readLayout();
        const current = layout.viewZoom === "fit" ? lastFitScale : layout.viewZoom;
        bumpViewZoom(current, -1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

export function RegisterPrint({
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  bankLabel,
  lines,
  banks,
  currency,
  fontSize = 12,
  cols,
}: {
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
}) {
  const layout = usePrintLayout();
  const [mounted, setMounted] = useState(false);
  const [chunks, setChunks] = useState<BalancedCashLine[][] | null>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const grandOut = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.payment, 0);
  const grandIn = lines.filter((l) => l.kind !== "opening").reduce((s, l) => s + l.deposit, 0);
  const grandLast = lines.at(-1)?.balance ?? 0;
  const type = layout.scale === "fit" ? 1 : layout.scale / 100;
  const typePx = Math.max(8, fontSize);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--register-font");
    root.style.setProperty("--register-font", `${typePx}px`);
    return () => {
      if (prev) root.style.setProperty("--register-font", prev);
      else root.style.removeProperty("--register-font");
    };
  }, [typePx]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const root = measureRef.current;
    if (!root) return;
    const innerH = printableHeightPx(layout.orient, layout.paper);
    const head = root.querySelector(".print-letterhead") as HTMLElement | null;
    const thead = root.querySelector("thead") as HTMLElement | null;
    const foot = root.querySelector("tfoot") as HTMLElement | null;
    const rows = Array.from(root.querySelectorAll("tbody tr")) as HTMLElement[];
    const heights = rows.map((r) => r.getBoundingClientRect().height).filter((h) => h > 0);
    const rowH = Math.max(
      4,
      heights.length ? (layout.scale === "fit" ? Math.max(...heights) : Math.min(...heights)) : 18,
    );
    const chrome =
      (head?.getBoundingClientRect().height ?? 40) +
      (thead?.getBoundingClientRect().height ?? 22) +
      (foot?.getBoundingClientRect().height ?? 22) +
      8;
    const usable = Math.max(rowH, innerH - chrome);
    const per = Math.max(1, Math.floor(usable / rowH));
    const next: BalancedCashLine[][] = [];
    if (lines.length === 0) next.push([]);
    else {
      for (let i = 0; i < lines.length; i += per) next.push(lines.slice(i, i + per));
    }
    setChunks((prev) => {
      if (
        prev &&
        prev.length === next.length &&
        prev.every((chunk, i) => chunk.length === next[i].length && chunk[0]?.id === next[i][0]?.id && chunk.at(-1)?.id === next[i].at(-1)?.id)
      ) {
        return prev;
      }
      return next;
    });
  }, [mounted, lines, layout.orient, layout.paper, layout.scale, cols, typePx]);

  if (!mounted) return null;

  const pageProps = {
    companyName,
    companyAddress: companyAddress ?? "",
    companyPhone: companyPhone ?? "",
    companyEmail: companyEmail ?? "",
    bankLabel,
    banks,
    currency,
    grandOut,
    grandIn,
    grandLast,
    cols,
    fontSize: typePx,
  };
  const sample = lines.slice(0, Math.min(8, lines.length));

  return (
    <>
      {createPortal(
        <div
          className="print-measure no-print"
          ref={measureRef}
          aria-hidden
          style={{
            ["--register-font" as string]: `${typePx}px`,
            ["--print-type" as string]: String(type),
          }}
        >
          <PrintPage {...pageProps} lines={sample} continued={false} showTotals />
        </div>,
        document.body,
      )}
      {createPortal(
        <PrintFrame>
          {(chunks ?? [[]]).map((chunk, i) => (
            <PrintPage
              key={chunk[0]?.id ?? `p${i}`}
              {...pageProps}
              lines={chunk}
              continued={i > 0}
              showTotals={i === (chunks?.length ?? 1) - 1}
            />
          ))}
        </PrintFrame>,
        document.body,
      )}
    </>
  );
}

function PrintPage({
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  bankLabel,
  lines,
  banks,
  currency,
  grandOut,
  grandIn,
  grandLast,
  cols,
  fontSize,
  continued = false,
  showTotals = true,
}: {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  bankLabel: string;
  lines: BalancedCashLine[];
  banks: { id: string; nickname: string }[];
  currency: string;
  grandOut: number;
  grandIn: number;
  grandLast: number;
  cols: RegisterCols;
  fontSize?: number;
  continued?: boolean;
  showTotals?: boolean;
}) {
  const visible = REGISTER_COLS.filter((c) => cols[c.id]);
  const lead = visible.findIndex((c) => c.id === "payment" || c.id === "deposit" || c.id === "balance");
  const labelSpan = lead === -1 ? visible.length : lead;

  return (
    <article className="print-sheet" style={fontSize ? { ["--register-font" as string]: `${fontSize}px` } : undefined}>
      <PrintLetterhead
        title={continued ? "Bank Register (continued)" : "Bank Register"}
        subtitle={`${bankLabel} · ${formatDate(todayIso())}`}
        companyName={companyName}
        companyAddress={companyAddress}
        companyPhone={companyPhone}
        companyEmail={companyEmail}
      />
      {lines.length === 0 || visible.length === 0 ? (
        <p className="print-sheet-empty">Nothing to print for these filters.</p>
      ) : (
        <table className="register-print-table">
          <colgroup>
            {visible.map((col) => (
              <col
                key={col.id}
                className={
                  col.id === "payee" || col.id === "memo"
                    ? `${REGISTER_COL_CLASS[col.id]} col-flex`
                    : `${REGISTER_COL_CLASS[col.id]} col-fit`
                }
              />
            ))}
          </colgroup>
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
          {showTotals && (cols.payment || cols.deposit || cols.balance) ? (
            <tfoot>
              <tr>
                {visible.map((col, i) => {
                  if (labelSpan > 0 && i === 0) {
                    return (
                      <td key="label" colSpan={labelSpan}>
                        Totals
                      </td>
                    );
                  }
                  if (labelSpan > 0 && i < labelSpan) return null;
                  if (col.id === "payment") {
                    return (
                      <td key={col.id} className={`${REGISTER_COL_CLASS.payment} num`}>
                        <Money amount={grandOut} currency={currency} className="text-debit" />
                      </td>
                    );
                  }
                  if (col.id === "deposit") {
                    return (
                      <td key={col.id} className={`${REGISTER_COL_CLASS.deposit} num`}>
                        <Money amount={grandIn} currency={currency} className="text-credit" />
                      </td>
                    );
                  }
                  if (col.id === "balance") {
                    return (
                      <td key={col.id} className={`${REGISTER_COL_CLASS.balance} num`}>
                        <Money amount={grandLast} currency={currency} />
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

function renderCell(id: RegisterColId, line: BalancedCashLine, bank: string, currency: string) {
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
