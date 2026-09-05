import { useEffect, useState } from "react";
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

function usePhoneUi() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), ((hover: none) and (pointer: coarse))");
    const apply = () => setPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return phone;
}

export function CompanySwitcher({ className }: { className?: string } = {}) {
  const { order, companies, activeId, switchCompany, addCompany } = useFinanceStore(
    useShallow((s) => ({
      order: s.companyOrder,
      companies: s.companies,
      activeId: s.activeCompanyId,
      switchCompany: s.switchCompany,
      addCompany: s.addCompany,
    })),
  );
  const [newOpen, setNewOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const phone = usePhoneUi();
  const active = companies[activeId];
  const name = active?.settings.companyName ?? "Company";

  function pick(id: string) {
    switchCompany(id);
    setPickerOpen(false);
  }

  const trigger = (
    <button
      type="button"
      className={cn(
        "company-switcher-trigger flex min-h-10 min-w-0 max-w-full items-center gap-1.5 rounded-xl px-2.5 text-left hover:bg-accent",
        "relative z-20 touch-manipulation",
        className,
      )}
      aria-label={`Switch company (current: ${name})`}
      onClick={phone ? () => setPickerOpen(true) : undefined}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      <span className="hidden shrink-0 whitespace-nowrap text-xs text-muted-foreground md:inline">
        {formatDate(todayIso())}
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );

  const list = (
    <div className="grid gap-1">
      {order.map((id) => {
        const label = companies[id]?.settings.companyName ?? "Company";
        const on = id === activeId;
        return (
          <button
            key={id}
            type="button"
            className={cn(
              "flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm",
              on ? "bg-accent text-foreground" : "hover:bg-muted",
            )}
            onClick={() => pick(id)}
          >
            <Check className={cn("size-4 shrink-0", on ? "opacity-100" : "opacity-0")} />
            <span className="min-w-0 flex-1 truncate">
              {label}
              {id === SAMPLE_COMPANY_ID ? <span className="text-muted-foreground"> · sample</span> : null}
            </span>
          </button>
        );
      })}
      <Button
        variant="outline"
        className="mt-1 w-full"
        onClick={() => {
          setPickerOpen(false);
          setNewOpen(true);
        }}
      >
        New company
      </Button>
    </div>
  );

  return (
    <>
      {phone ? (
        <>
          {trigger}
          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Switch company</DialogTitle>
                <DialogDescription>Pick which company&apos;s books to open.</DialogDescription>
              </DialogHeader>
              {list}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56 z-[300]">
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
            <DropdownMenuItem onClick={() => setNewOpen(true)}>New company</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <NewCompanyDialog open={newOpen} onClose={() => setNewOpen(false)} onCreate={addCompany} />
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
            Starts a blank set of books. The Pacific Harbor sample stays unless you remove it in Settings.
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
