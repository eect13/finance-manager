import { Badge } from "@/components/ui/badge";
import type { BillStatus, CheckStatus, InvoiceStatus, ReceiptMethod, ReceiptStatus } from "@/lib/finance/types";

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function CheckBadge({ status }: { status: CheckStatus }) {
  const label = { pending: "Pending", cleared: "Cleared", voided: "Voided", bounced: "Bounced" }[status];
  return <Badge variant={status}>{label}</Badge>;
}

export function InvoiceBadge({
  status,
  overdue,
}: {
  status: InvoiceStatus;
  overdue?: boolean;
}) {
  if (overdue && (status === "sent" || status === "partial" || status === "draft")) {
    return <Badge variant="overdue">Overdue</Badge>;
  }
  const label = {
    draft: "Draft",
    sent: "Open",
    partial: "Partial",
    paid: "Paid",
    void: "Void",
  }[status];
  const variant = status === "void" ? "voided" : status;
  return <Badge variant={variant}>{label}</Badge>;
}

export function BillBadge({ status, overdue }: { status: BillStatus; overdue?: boolean }) {
  if (overdue && (status === "open" || status === "partial")) {
    return <Badge variant="overdue">Overdue</Badge>;
  }
  const label = { open: "Open", partial: "Partial", paid: "Paid", void: "Void" }[status];
  const variant = status === "open" ? "sent" : status === "void" ? "voided" : status;
  return <Badge variant={variant}>{label}</Badge>;
}

export function ReceiptBadge({
  status,
  kind,
  method,
}: {
  status: ReceiptStatus;
  kind?: "cash-sale" | "payment";
  method?: ReceiptMethod;
}) {
  if (status === "void") return <Badge variant="voided">Void</Badge>;
  if (method === "check") return <Badge variant="cleared">Check</Badge>;
  if (method === "card") return <Badge variant="sent">Card</Badge>;
  if (method === "echeck") return <Badge variant="sent">E-Check</Badge>;
  if (kind === "cash-sale") return <Badge variant="paid">Cash Sale</Badge>;
  if (kind === "payment") return <Badge variant="sent">On Account</Badge>;
  return <Badge variant="cleared">Posted</Badge>;
}

export function StatusLabel({ status }: { status: string }) {
  if (!status) return null;
  return <Badge>{titleCase(status)}</Badge>;
}
