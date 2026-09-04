import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/finance/format";
import { useFinanceData } from "@/lib/finance/store";

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
  const settings = useFinanceData().settings;
  const tone = signed ? (amount < 0 ? "text-debit" : amount > 0 ? "text-credit" : "") : amount < 0 ? "text-debit" : "";
  return (
    <span className={cn("tabular-nums tracking-tight", tone, className)}>
      {formatMoney(amount, currency, {
        useThousandSeparators: settings.useThousandSeparators !== false,
        decimalPlaces: settings.decimalPlaces,
      })}
    </span>
  );
}
