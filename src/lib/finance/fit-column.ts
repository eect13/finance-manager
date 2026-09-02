let canvas: HTMLCanvasElement | null = null;

function measure(text: string, font: string) {
  if (typeof document === "undefined") return text.length * 8;
  canvas ??= document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Width from currently painted cells. Header title is a fallback only. */
export function fitColumnWidth(opts: {
  table: HTMLElement;
  selector: string;
  header: string;
  min?: number;
  max?: number;
  pad?: number;
}): number {
  const { table, selector, header, min = 56, max = 420, pad = 32 } = opts;
  const sample = (table.querySelector(selector) ?? table.querySelector("th")) as HTMLElement | null;
  const style = sample ? getComputedStyle(sample) : null;
  const font = style ? `${style.fontWeight} ${style.fontSize} ${style.fontFamily}` : "500 13px sans-serif";
  let widest = 0;
  const nodes = table.querySelectorAll(selector);
  const n = nodes.length;
  const cap = 64;
  const step = n > cap ? Math.ceil(n / cap) : 1;
  for (let i = 0; i < n; i += step) {
    const text = (nodes[i] as HTMLElement).textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (text) widest = Math.max(widest, measure(text, font));
  }
  if (widest === 0) widest = measure(header, font);
  return Math.min(max, Math.max(min, Math.round(widest + pad)));
}

export function widthsMatch<K extends string>(a: Record<K, number>, b: Record<K, number>) {
  for (const key of Object.keys(b) as K[]) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/** Auto-fit every listed column from `data-col` / `col-*` cells currently painted. */
export function autoFitTable(
  table: HTMLElement,
  ids: string[],
  opts?: { min?: number; max?: number },
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const id of ids) {
    const th = table.querySelector(`thead th[data-col="${id}"]`) as HTMLElement | null;
    const header = (th?.innerText ?? id).replace(/\s+/g, " ").trim() || id;
    next[id] = fitColumnWidth({
      table,
      selector: `td[data-col="${id}"], td.col-${id}`,
      header,
      min: opts?.min,
      max: opts?.max,
    });
  }
  return next;
}
