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
  visibleCsv,
} from "@/lib/finance/export";
import { auBasCsvRows } from "@/lib/finance/au-bas";
import { fxDocumentCsvRows, fxRateCsvRows } from "@/lib/finance/fx";
import { genericVatCsvRows } from "@/lib/finance/generic-vat";
import {
  thirteenthMonthCsvRows,
  vatSummaryRows,
  withholding1601cRows,
} from "@/lib/finance/ph-bir";
import { sgCpfCsvRows } from "@/lib/finance/sg-cpf";
import { ukPayeCsvRows } from "@/lib/finance/uk-paye";
import { usW2CsvRows } from "@/lib/finance/us-payroll";
import { todayIso } from "@/lib/finance/format";
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
  const asOf = todayIso();
  const year = Number(asOf.slice(0, 4)) || new Date().getFullYear();
  const yearStart = `${year}-01-01`;
  const s = data.settings;
  const actions: ExportCsvAction[] = [
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
  // BIR-flavored / PH helpers — only build rows when the regional module is on (avoids work on every Export open).
  if (s.modulePhBirExports) {
    actions.push({ label: "VAT summary CSV", filename: `vat-summary-${day}.csv`, rows: vatSummaryRows(data, asOf) });
    actions.push({
      label: "1601-C withholding CSV",
      filename: `1601c-withholding-${year}.csv`,
      rows: withholding1601cRows(data, yearStart, asOf),
    });
  }
  if (s.modulePh13thMonth) {
    actions.push({
      label: "13th month estimate CSV",
      filename: `13th-month-${year}.csv`,
      rows: thirteenthMonthCsvRows(data, year, asOf),
    });
  }
  const m = s.modules ?? {};
  if (m.usPayroll) {
    actions.push({
      label: "US W-2 style estimate CSV",
      filename: `us-w2-estimate-${year}.csv`,
      rows: usW2CsvRows(data, year, asOf),
    });
  }
  if (m.sgCpf) {
    actions.push({
      label: "Singapore CPF estimate CSV",
      filename: `sg-cpf-estimate-${year}.csv`,
      rows: sgCpfCsvRows(data, year, asOf),
    });
  }
  if (m.genericVat) {
    actions.push({
      label: "VAT/GST workbook CSV",
      filename: `vat-gst-workbook-${day}.csv`,
      rows: genericVatCsvRows(data, asOf),
    });
  }
  if (m.auBas) {
    actions.push({
      label: "Australia BAS / PAYG CSV",
      filename: `au-bas-payg-${year}.csv`,
      rows: auBasCsvRows(data, year, asOf),
    });
  }
  if (m.ukPaye) {
    actions.push({
      label: "UK PAYE + NI estimate CSV",
      filename: `uk-paye-ni-${year}.csv`,
      rows: ukPayeCsvRows(data, year, asOf),
    });
  }
  if (m.multiCurrency) {
    actions.push({ label: "FX rates CSV", filename: `fx-rates-${day}.csv`, rows: fxRateCsvRows(data) });
    actions.push({
      label: "FX converted documents CSV",
      filename: `fx-documents-${day}.csv`,
      rows: fxDocumentCsvRows(data, asOf),
    });
  }
  return actions;
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
  visible,
}: {
  filename: string;
  rows: Array<Record<string, string | number>>;
  label?: string;
  visible?: Record<string, boolean>;
}) {
  return (
    <Button variant="outline" onClick={() => saveCsv(filename, visibleCsv(rows, visible))}>
      <Download />
      {label}
    </Button>
  );
}
