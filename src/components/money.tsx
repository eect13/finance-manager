import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/finance/format";

export function Money({
  amount,
  currency,
  signed = false,
  className,
}: {
  amount: number;
  currency: string;
  signed?: boolean;
  className?: string;
}) {
  const tone = signed ? (amount < 0 ? "text-debit" : amount > 0 ? "text-credit" : "") : amount < 0 ? "text-debit" : "";
  return (
    <span className={cn("tabular-nums tracking-tight", tone, className)}>
      {formatMoney(amount, currency)}
    </span>
  );
}
