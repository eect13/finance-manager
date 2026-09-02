import { cn } from "@/lib/utils";

/** Navy tile + cream pillars in light; inverts with the theme tokens. */
export function AppMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={36}
      height={36}
      className={cn("app-mark shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect className="app-mark-tile" width="16" height="16" rx="3.5" />
      <rect className="app-mark-ink" x="3.4" y="4" width="9.2" height="1.4" rx=".4" />
      <rect className="app-mark-ink" x="4.05" y="5.8" width="1.6" height="6.2" rx=".4" />
      <rect className="app-mark-ink" x="7.2" y="5.8" width="1.6" height="6.2" rx=".4" />
      <rect className="app-mark-ink" x="10.35" y="5.8" width="1.6" height="6.2" rx=".4" />
    </svg>
  );
}
