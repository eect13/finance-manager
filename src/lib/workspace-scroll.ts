/** Workspace scroll root from AppShell (`main[data-workspace-scroll]`). */
export function getWorkspaceScrollElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector<HTMLElement>("main[data-workspace-scroll]") ??
    document.querySelector<HTMLElement>("[data-workspace-scroll]")
  );
}

const EDGE_PX = 56;
const MAX_STEP = 28;

/**
 * While dragging near the top/bottom of the workspace scroller, nudge scrollTop.
 * Returns true if a scroll step was applied (caller can keep rAF-ing while held in the edge).
 */
export function autoScrollWorkspaceAt(clientY: number): boolean {
  const scroller = getWorkspaceScrollElement();
  if (!scroller) return false;
  const rect = scroller.getBoundingClientRect();
  let dy = 0;
  if (clientY < rect.top + EDGE_PX) {
    const t = (rect.top + EDGE_PX - clientY) / EDGE_PX;
    dy = -Math.ceil(MAX_STEP * Math.min(1, Math.max(0.25, t)));
  } else if (clientY > rect.bottom - EDGE_PX) {
    const t = (clientY - (rect.bottom - EDGE_PX)) / EDGE_PX;
    dy = Math.ceil(MAX_STEP * Math.min(1, Math.max(0.25, t)));
  }
  if (!dy) return false;
  const before = scroller.scrollTop;
  scroller.scrollTop += dy;
  return scroller.scrollTop !== before;
}
