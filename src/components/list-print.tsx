import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatDate, todayIso } from "@/lib/finance/format";
import { PrintFrame, PrintLetterhead } from "@/components/print-preview";
import { useFinanceData } from "@/lib/finance/store";

export type PrintCol = { key: string; label: string; align?: "left" | "right" };

export function ListPrint({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string;
  subtitle?: string;
  columns: PrintCol[];
  rows: Array<Record<string, string>>;
}) {
  const data = useFinanceData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <PrintFrame>
      <article className="print-sheet">
        <PrintLetterhead
          title={title}
          subtitle={`${subtitle ? `${subtitle} · ` : ""}${formatDate(todayIso())}`}
          companyName={data.settings.companyName}
          companyAddress={data.settings.companyAddress}
          companyPhone={data.settings.companyPhone}
          companyEmail={data.settings.companyEmail}
        />
        {rows.length === 0 ? (
          <p className="print-sheet-empty">Nothing to print.</p>
        ) : (
          <table className="register-print-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={col.align === "right" ? "col-money" : undefined}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.align === "right" ? "col-money" : undefined}>
                      {row[col.key] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </PrintFrame>,
    document.body,
  );
}
