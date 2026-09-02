/** Modifier chord for Find — Ctrl on Windows/Linux, ⌘ on Apple. */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform || "";
  const ua = navigator.userAgent || "";
  return /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X/.test(ua);
}

export function findShortcutLabel(): string {
  return isApplePlatform() ? "⌘K" : "Ctrl+K";
}

export function undoShortcutLabel(): string {
  return isApplePlatform() ? "⌘Z" : "Ctrl+Z";
}

export function redoShortcutLabel(): string {
  return isApplePlatform() ? "⌘⇧Z" : "Ctrl+Y";
}

export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest("[contenteditable='true']"));
}
