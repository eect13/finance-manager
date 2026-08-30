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
