import { CheckBadge, ReconBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CheckStatus, ReconStatus } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export type CheckStatusMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

/** Shared Pending / Cleared / Bounce / Void actions for live checks. */
export function checkStatusMenuItems(
  status: CheckStatus,
  onSelect: (next: CheckStatus) => void,
): CheckStatusMenuItem[] {
  if (status === "voided" || status === "bounced") return [];
  const items: CheckStatusMenuItem[] = [];
  if (status !== "pending") {
    items.push({ label: "Pending", onSelect: () => onSelect("pending") });
  }
  if (status !== "cleared") {
    items.push({ label: "Cleared", onSelect: () => onSelect("cleared") });
  }
  items.push({ label: "Bounce", onSelect: () => onSelect("bounced") });
  items.push({ label: "Void", onSelect: () => onSelect("voided"), danger: true });
  return items;
}

export function CheckStatusControl({
  status,
  recon,
  onSetStatus,
  className,
}: {
  status: CheckStatus;
  recon: ReconStatus;
  onSetStatus: (next: CheckStatus) => void;
  className?: string;
}) {
  const locked = recon === "reconciled" || status === "voided" || status === "bounced";
  const badge = recon === "reconciled" ? <ReconBadge recon="reconciled" /> : <CheckBadge status={status} />;
  if (locked) {
    return <span className={className}>{badge}</span>;
  }
  const items = checkStatusMenuItems(status, onSetStatus);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-lg border border-transparent px-1 py-0.5 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label={`Check status ${status}. Open menu for Pending, Cleared, Bounce, or Void.`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {badge}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.onSelect}
            className={item.danger ? "text-destructive" : undefined}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
