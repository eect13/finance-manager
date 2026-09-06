let canvas: HTMLCanvasElement | null = null;

function measure(text: string, font: string) {
  if (typeof document === "undefined") return text.length * 8;
  canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Floor so Name/payee absorbers never collapse when fit cols are generous. */
export const FLEX_COL_MIN = 140;
/** Floor for ⋯ (size-8) + --list-actions-px breathing room — not flush to card edge. */
export const ACTIONS_COL_MIN = 64;

export type ColRole = "flex" | "actions" | "fit";

export function columnRole(table: HTMLElement, id: string): ColRole {
  if (id === "actions") return "actions";
  const col =
    (table.querySelector(`colgroup col[data-col="${id}"]`) as HTMLElement | null) ??
    (table.querySelector(`colgroup col.col-${id}`) as HTMLElement | null) ??
    (Array.from(table.querySelectorAll("colgroup col")).find((node) =>
      Array.from(node.classList).some((c) => c === `col-${id}` || c.endsWith(`-${id}`)),
    ) as HTMLElement | undefined) ??
    null;
  const th = table.querySelector(`thead th[data-col="${id}"]`) as HTMLElement | null;
  const el = col ?? th;
  if (el?.classList.contains("col-actions")) return "actions";
  if (el?.classList.contains("col-flex") || el?.classList.contains("col-fill")) return "flex";
  if (th?.classList.contains("col-flex") || th?.classList.contains("col-fill")) return "flex";
  return "fit";
}

function cellContentWidth(el: HTMLElement) {
  const inner = el.firstElementChild as HTMLElement | null;
  const sw = Math.max(el.scrollWidth || 0, inner?.scrollWidth || 0);
  if (sw > 0) return sw;
  const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return 0;
  const style = getComputedStyle(el);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return measure(text, font) + 28;
}

/** Width from currently painted cells. Header cluster is a floor; never viewport-crush. */
export function fitColumnWidth(opts: {
  table: HTMLElement;
  selector: string;
  header: string;
  min?: number;
  max?: number;
  pad?: number;
}): number {
  const { table, selector, header, min = 56, max = 420, pad = 8 } = opts;
  let widest = 0;
  const nodes = table.querySelectorAll(selector);
  const n = nodes.length;
  const cap = 64;
  const step = n > cap ? Math.ceil(n / cap) : 1;
  for (let i = 0; i < n; i += step) {
    widest = Math.max(widest, cellContentWidth(nodes[i] as HTMLElement));
  }

  const dataCol = selector.match(/data-col="([^"]+)"/)?.[1] ?? selector.match(/col-([a-z0-9_-]+)/i)?.[1];
  const th = (
    dataCol ? table.querySelector(`thead th[data-col="${dataCol}"]`) : table.querySelector("thead th")
  ) as HTMLElement | null;
  if (th) {
    const cluster = th.querySelector(".sort-header-cluster") as HTMLElement | null;
    widest = Math.max(widest, cluster?.scrollWidth || 0, th.scrollWidth || 0);
  }
  if (widest === 0) {
    const sample = (table.querySelector(selector) ?? th) as HTMLElement | null;
    const style = sample ? getComputedStyle(sample) : null;
    const font = style ? `${style.fontWeight} ${style.fontSize} ${style.fontFamily}` : "500 13px sans-serif";
    widest = measure(header, font) + 32;
  }

  return Math.min(max, Math.max(min, Math.round(widest + pad)));
}

export function widthsMatch<K extends string>(a: Record<K, number>, b: Record<K, number>) {
  for (const key of Object.keys(b) as K[]) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Auto-fit every listed column from painted cells, then fill leftover window
 * space into flex columns. Never shrinks below content (card scrolls instead).
 */
export function autoFitTable(
  table: HTMLElement,
  ids: string[],
  opts?: { min?: number; max?: number; targetWidth?: number },
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const id of ids) {
    const role = columnRole(table, id);
    const th = table.querySelector(`thead th[data-col="${id}"]`) as HTMLElement | null;
    const header = (th?.innerText ?? id).replace(/\s+/g, " ").trim() || id;
    const min =
      role === "actions"
        ? Math.max(opts?.min ?? 56, ACTIONS_COL_MIN)
        : role === "flex"
          ? Math.max(opts?.min ?? 56, FLEX_COL_MIN)
          : (opts?.min ?? 56);
    const max = role === "actions" ? Math.min(opts?.max ?? 420, 280) : (opts?.max ?? 420);
    next[id] = fitColumnWidth({
      table,
      selector: `td[data-col="${id}"], td.col-${id}`,
      header,
      min,
      max,
    });
  }
  const target = opts?.targetWidth ?? table.parentElement?.clientWidth ?? table.clientWidth;
  return fillToWindow(next, ids, target, (id) => columnRole(table, id) === "flex", opts?.max ?? 420);
}

/**
 * Default width sits between content auto-fit and the list window:
 * never shrink below content; if there is leftover room, give it to flex cols.
 */
export function fillToWindow<T extends Record<string, number>>(
  widths: T,
  ids: string[],
  targetWidth: number,
  isFlex: (id: string) => boolean,
  max = 420,
): T {
  if (!(targetWidth > 0) || ids.length === 0) return widths;
  const next = { ...widths };
  const sum = ids.reduce((s, id) => s + (next[id] ?? 0), 0);
  const extra = Math.floor(targetWidth - sum);
  if (extra <= 0) return next;
  const sinks = ids.filter((id) => isFlex(id) && id !== "check" && id !== "actions");
  const targets = sinks.length ? sinks : ids.filter((id) => id !== "check" && id !== "actions");
  if (!targets.length) return next;
  const each = Math.floor(extra / targets.length);
  let rem = extra - each * targets.length;
  for (const id of targets) {
    const add = each + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    (next as Record<string, number>)[id] = Math.min(max, (next[id] ?? 0) + add);
  }
  return next;
}
