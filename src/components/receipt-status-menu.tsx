import { ReceiptBadge, ReconBadge } from "@/components/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReceiptMethod, ReceiptStatus, ReconStatus } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

export type ReceiptStatusAction = "pending" | "cleared" | "void";

export type ReceiptStatusMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

/** Shared Pending / Cleared / Void for live receipts (ledger status is posted | void; clear lives on recon). */
export function receiptStatusMenuItems(
  status: ReceiptStatus,
  recon: ReconStatus,
  onSelect: (next: ReceiptStatusAction) => void,
): ReceiptStatusMenuItem[] {
  if (status === "void" || recon === "reconciled") return [];
  const items: ReceiptStatusMenuItem[] = [];
  if (recon !== "pending") {
    items.push({ label: "Pending", onSelect: () => onSelect("pending") });
  }
  if (recon !== "cleared") {
    items.push({ label: "Cleared", onSelect: () => onSelect("cleared") });
  }
  items.push({ label: "Void", onSelect: () => onSelect("void"), danger: true });
  return items;
}

export function ReceiptStatusControl({
  status,
  recon,
  kind,
  method,
  onAction,
  className,
}: {
  status: ReceiptStatus;
  recon: ReconStatus;
  kind?: "cash-sale" | "payment";
  method?: ReceiptMethod;
  onAction: (next: ReceiptStatusAction) => void;
  className?: string;
}) {
  const locked = recon === "reconciled" || status === "void";
  const badge =
    status === "void" ? (
      <ReceiptBadge status="void" kind={kind} method={method} />
    ) : recon === "reconciled" ? (
      <ReconBadge recon="reconciled" />
    ) : (
      <ReconBadge recon={recon} />
    );
  if (locked) {
    return <span className={className}>{badge}</span>;
  }
  const items = receiptStatusMenuItems(status, recon, onAction);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-lg border border-transparent px-1 py-0.5 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label={`Receipt status ${recon}. Open menu for Pending, Cleared, or Void.`}
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
