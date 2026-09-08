/** Layout-viewport rect → visual-viewport coords for `position: fixed` (keyboard / pinch-zoom). */

export type FixedPlace = { top: number; left: number; width: number; maxHeight: number };

function viewBox() {
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  return {
    x: vv?.offsetLeft ?? 0,
    y: vv?.offsetTop ?? 0,
    w: vv?.width ?? (typeof window !== "undefined" ? window.innerWidth : 390),
    h: vv?.height ?? (typeof window !== "undefined" ? window.innerHeight : 844),
  };
}

export function placeFixedPopover(
  anchor: DOMRect,
  opts?: { width?: number; minWidth?: number; height?: number },
): FixedPlace {
  const { x, y, w, h } = viewBox();
  const pad = 8;
  const roomX = Math.max(pad * 2, w - pad * 2);
  const want = opts?.width ?? anchor.width;
  const width = Math.min(Math.max(opts?.minWidth ?? 0, want), roomX);
  let left = anchor.left - x;
  if (left + width > w - pad) left = w - pad - width;
  if (left < pad) left = pad;
  const wantH = opts?.height ?? 224;
  const below = h - (anchor.bottom - y) - pad;
  const above = anchor.top - y - pad;
  let top = anchor.bottom - y + 4;
  let maxHeight = Math.min(wantH, Math.max(96, below - 4));
  if (below < Math.min(96, wantH) && above > below) {
    maxHeight = Math.min(wantH, Math.max(96, above - 4));
    top = Math.max(pad, anchor.top - y - maxHeight - 4);
  } else if (top + maxHeight > h - pad) {
    maxHeight = Math.max(96, h - pad - top);
  }
  return { top, left, width, maxHeight };
}

export function onViewportChange(fn: () => void): () => void {
  window.addEventListener("resize", fn);
  window.addEventListener("scroll", fn, true);
  const vv = window.visualViewport;
  vv?.addEventListener("resize", fn);
  vv?.addEventListener("scroll", fn);
  return () => {
    window.removeEventListener("resize", fn);
    window.removeEventListener("scroll", fn, true);
    vv?.removeEventListener("resize", fn);
    vv?.removeEventListener("scroll", fn);
  };
}
