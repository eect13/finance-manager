import { Download } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  bankRows,
  backupPayload,
  billRows,
  cashRegisterRows,
  checkRegisterRows,
  customerRows,
  downloadText,
  exportCsv,
  invoiceRows,
  ledgerRows,
  receiptRows,
  trialBalanceRows,
  vendorRows,
  workspaceBackupPayload,
} from "@/lib/finance/export";
import { useFinanceStore } from "@/lib/finance/store";
import type { FinanceData } from "@/lib/finance/types";

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

function saveCsv(filename: string, rows: Array<Record<string, string | number>>) {
  exportCsv(filename, rows);
  toast.success("Downloaded CSV.");
}

export function ExportMenu({ data }: { data: FinanceData }) {
  const workspace = useFinanceStore(
    useShallow((s) => ({
      companies: s.companies,
      companyOrder: s.companyOrder,
      activeCompanyId: s.activeCompanyId,
    })),
  );
  const day = stamp();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Spreadsheets</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => saveCsv(`ledger-${day}.csv`, ledgerRows(data))}>
          General ledger CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`trial-balance-${day}.csv`, trialBalanceRows(data))}>
          Trial balance CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`bank-register-${day}.csv`, cashRegisterRows(data))}>
          Bank register CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`checks-${day}.csv`, checkRegisterRows(data))}>
          Check register CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`invoices-${day}.csv`, invoiceRows(data))}>
          Invoices CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`customers-${day}.csv`, customerRows(data))}>
          Customers CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`vendors-${day}.csv`, vendorRows(data))}>
          Vendors CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`receipts-${day}.csv`, receiptRows(data))}>
          Receipts CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`bills-${day}.csv`, billRows(data))}>
          Bills CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => saveCsv(`banks-${day}.csv`, bankRows(data))}>
          Banks CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Backup</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            downloadText(`finance-manager-${day}.json`, workspaceBackupPayload(workspace), "application/json");
            toast.success("Downloaded backup.");
          }}
        >
          All companies JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            downloadText(`finance-manager-company-${day}.json`, backupPayload(data), "application/json");
            toast.success("Downloaded this company.");
          }}
        >
          This company JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
