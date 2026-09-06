import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  bankRows,
  billRows,
  cashRegisterRows,
  checkRegisterRows,
  customerRows,
  exportCsv,
  invoiceRows,
  ledgerRows,
  receiptRows,
  trialBalanceRows,
  vendorRows,
} from "@/lib/finance/export";
import type { FinanceData } from "@/lib/finance/types";

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function saveCsv(filename: string, rows: Array<Record<string, string | number>>) {
  exportCsv(filename, rows);
  toast.success("Downloaded CSV.");
}

export type ExportCsvAction = { label: string; filename: string; rows: Array<Record<string, string | number>> };

export function exportCsvActions(data: FinanceData, day = stamp()): ExportCsvAction[] {
  return [
    { label: "General ledger CSV", filename: `ledger-${day}.csv`, rows: ledgerRows(data) },
    { label: "Trial balance CSV", filename: `trial-balance-${day}.csv`, rows: trialBalanceRows(data) },
    { label: "Bank register CSV", filename: `bank-register-${day}.csv`, rows: cashRegisterRows(data) },
    { label: "Check register CSV", filename: `checks-${day}.csv`, rows: checkRegisterRows(data) },
    { label: "Invoices CSV", filename: `invoices-${day}.csv`, rows: invoiceRows(data) },
    { label: "Customers CSV", filename: `customers-${day}.csv`, rows: customerRows(data) },
    { label: "Vendors CSV", filename: `vendors-${day}.csv`, rows: vendorRows(data) },
    { label: "Receipts CSV", filename: `receipts-${day}.csv`, rows: receiptRows(data) },
    { label: "Bills CSV", filename: `bills-${day}.csv`, rows: billRows(data) },
    { label: "Banks CSV", filename: `banks-${day}.csv`, rows: bankRows(data) },
  ];
}

export function ExportMenu({ data }: { data: FinanceData }) {
  const actions = exportCsvActions(data);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="lg:h-11 lg:w-auto lg:px-4"
          aria-label="Export"
          title="Export spreadsheets (CSV)"
        >
          <Download />
          <span className="hidden lg:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Spreadsheets</DropdownMenuLabel>
        {actions.map((a) => (
          <DropdownMenuItem key={a.filename} onClick={() => saveCsv(a.filename, a.rows)}>
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Phone More: flat CSV list (avoids DropdownMenu-in-Dialog stacking). */
export function ExportMorePanel({
  data,
  onDone,
}: {
  data: FinanceData;
  onDone?: () => void;
}) {
  const actions = exportCsvActions(data);
  return (
    <div className="grid gap-1" role="group" aria-label="Export spreadsheets">
      <p className="px-3 pt-2 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">Export CSV</p>
      {actions.map((a) => (
        <button
          key={a.filename}
          type="button"
          className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm hover:bg-muted"
          onClick={() => {
            saveCsv(a.filename, a.rows);
            onDone?.();
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

export function CsvButton({
  filename,
  rows,
  label = "CSV",
}: {
  filename: string;
  rows: Array<Record<string, string | number>>;
  label?: string;
}) {
  return (
    <Button variant="outline" onClick={() => saveCsv(filename, rows)}>
      <Download />
      {label}
    </Button>
  );
}
