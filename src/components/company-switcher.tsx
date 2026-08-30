import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SAMPLE_COMPANY_ID } from "@/lib/finance/seed";
import { formatDate, todayIso } from "@/lib/finance/format";
import { useFinanceStore } from "@/lib/finance/store";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const { order, companies, activeId, switchCompany, addCompany } = useFinanceStore(
    useShallow((s) => ({
      order: s.companyOrder,
      companies: s.companies,
      activeId: s.activeCompanyId,
      switchCompany: s.switchCompany,
      addCompany: s.addCompany,
    })),
  );
  const [open, setOpen] = useState(false);
  const active = companies[activeId];
  const name = active?.settings.companyName ?? "Company";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 min-w-0 max-w-full items-center gap-1 rounded-md text-left hover:bg-accent"
            aria-label="Switch company"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block text-xs text-muted-foreground">{formatDate(todayIso())}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuLabel>Companies</DropdownMenuLabel>
          {order.map((id) => {
            const label = companies[id]?.settings.companyName ?? "Company";
            const on = id === activeId;
            return (
              <DropdownMenuItem key={id} onClick={() => switchCompany(id)}>
                <Check className={cn("size-4", on ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0 truncate">
                  {label}
                  {id === SAMPLE_COMPANY_ID ? <span className="text-muted-foreground"> · sample</span> : null}
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>New company</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewCompanyDialog open={open} onClose={() => setOpen(false)} onCreate={addCompany} />
    </>
  );
}

export function NewCompanyDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => string;
}) {
  const [name, setName] = useState("");
  function create() {
    const id = onCreate(name);
    if (id) toast.success("Blank books. Add a bank to begin.");
    setName("");
    onClose();
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New company</DialogTitle>
          <DialogDescription>
            Starts a blank set of books. Pacific Harbor Trading stays as the sample you can switch back to.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Company name"
          aria-label="Company name"
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={create} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
