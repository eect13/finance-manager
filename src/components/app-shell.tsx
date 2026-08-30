import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Banknote,
  BookMarked,
  BookOpen,
  Building2,
  CalendarDays,
  CalendarRange,
  FileSpreadsheet,
  Handshake,
  LayoutDashboard,
  Menu,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ScrollText,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { totalCash } from "@/lib/finance/ledger";
import { useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import { CompanySwitcher } from "./company-switcher";
import { ExportMenu } from "./export-menu";
import { FindButton, FindTransaction } from "./find-transaction";
import { Money } from "./money";
import { RecordSheet } from "./record-sheet";
import { ThemeToggle } from "./theme-toggle";
import { applyTheme, useTheme } from "@/lib/theme";
import { APP_VERSION_LABEL } from "@/lib/version";

const NAV = [
  {
    label: "Treasury",
    items: [
      { to: "/", label: "Desk", icon: LayoutDashboard },
      { to: "/register", label: "Register", icon: BookMarked },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/banks", label: "Banks", icon: Building2 },
      { to: "/receipts", label: "Receipts", icon: Banknote },
      { to: "/checks", label: "Checks", icon: NotebookPen },
    ],
  },
  {
    label: "Receivables",
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    label: "Payables",
    items: [
      { to: "/vendors", label: "Vendors", icon: Handshake },
      { to: "/bills", label: "Bills", icon: ScrollText },
    ],
  },
  {
    label: "Planning",
    items: [{ to: "/forecast", label: "Forecast", icon: CalendarRange }],
  },
  {
    label: "Books",
    items: [
      { to: "/ledger", label: "Ledger", icon: BookOpen },
      { to: "/reports", label: "Reports", icon: FileSpreadsheet },
    ],
  },
];

const FLAT_NAV = [...NAV.flatMap((group) => group.items), { to: "/settings", label: "Settings", icon: Settings }];
const SIDEBAR_KEY = "finance-manager-sidebar";

function readRail() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "rail";
  } catch {
    return false;
  }
}

function NavLinks({ rail, onNavigate }: { rail?: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className={cn("flex flex-1 flex-col gap-6 py-4", rail ? "px-2" : "px-3")}>
      {NAV.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {rail ? null : (
            <p className="px-3 pb-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">{group.label}</p>
          )}
          {group.items.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                aria-label={item.label}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center rounded-xl text-sm",
                  rail ? "justify-center px-0" : "gap-3 px-3",
                  active ? "bg-card text-foreground elevation" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {rail ? null : item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({
  rail,
  onToggleRail,
  onNavigate,
}: {
  rail?: boolean;
  onToggleRail?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <div className={cn("flex items-center gap-2 py-5", rail ? "justify-center px-2" : "px-5")}>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          title={`Finance Manager ${APP_VERSION_LABEL}`}
        >
          <Wallet className="size-4" />
        </div>
        {rail ? null : (
          <div className="min-w-0">
            <p className="font-display text-lg leading-none font-medium tracking-tight">Finance</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              Manager
              <span className="rounded-md bg-muted px-1.5 py-px font-medium tracking-wide text-[0.65rem] tabular-nums text-muted-foreground">
                {APP_VERSION_LABEL}
              </span>
            </p>
          </div>
        )}
      </div>
      <NavLinks rail={rail} onNavigate={onNavigate} />
      <div className={cn("mt-auto flex flex-col gap-1 p-3", rail && "items-center p-2")}>
        {onToggleRail ? (
          <button
            type="button"
            onClick={onToggleRail}
            title={rail ? "Expand menu" : "Collapse menu"}
            aria-label={rail ? "Expand menu" : "Collapse menu"}
            aria-pressed={rail}
            className={cn(
              "flex min-h-11 items-center rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
              rail ? "size-11 justify-center" : "gap-3 px-3",
            )}
          >
            {rail ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {rail ? null : "Collapse"}
          </button>
        ) : null}
        <Link
          to="/settings"
          title="Settings"
          aria-label="Settings"
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center rounded-xl text-sm",
            rail ? "size-11 justify-center" : "gap-3 px-3",
            pathname.startsWith("/settings")
              ? "bg-card text-foreground elevation"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Settings className="size-4 shrink-0" />
          {rail ? null : "Settings"}
        </Link>
      </div>
    </>
  );
}

function ThemeSync() {
  const { theme, resolved } = useTheme();
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme, resolved]);
  return null;
}

function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex min-w-0 max-w-full gap-1 overflow-x-auto px-3 pb-3 md:hidden">
      {FLAT_NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm",
              active ? "bg-card elevation" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  description,
  actions,
  align = "start",
  compact = false,
  wide = false,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: "start" | "center";
  compact?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [rail, setRail] = useState(false);
  const hydrate = useFinanceStore((s) => s.hydrate);
  const data = useFinanceData();
  const { resolved } = useTheme();

  useLayoutEffect(() => {
    setRail(readRail());
  }, []);

  useEffect(() => {
    void Promise.resolve(useFinanceStore.persist.rehydrate()).finally(() => hydrate());
  }, [hydrate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFindOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleRail() {
    setRail((on) => {
      const next = !on;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "rail" : "full");
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  const cash = totalCash(data);

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-background text-foreground">
      <ThemeSync />
      <aside
        className={cn(
          "no-print sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar transition-[width] duration-200 ease-out md:flex",
          rail ? "w-16" : "w-60",
        )}
      >
        <SidebarBody rail={rail} onToggleRail={toggleRail} />
      </aside>

      <div className="app-workspace flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 min-w-0 overflow-x-hidden border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 md:px-8">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SidebarBody onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <CompanySwitcher />
            </div>
            <div className="hidden text-right sm:block">
              <p className="eyebrow">Book cash</p>
              <Money amount={cash} currency={data.settings.currency} className="text-sm font-medium" />
            </div>
            <FindButton onClick={() => setFindOpen(true)} />
            <ThemeToggle compact />
            <ExportMenu data={data} />
          </div>
          <MobileNav />
        </header>

        <main
          className={cn(
            "mx-auto w-full min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8",
            wide ? "max-w-none" : "max-w-6xl",
          )}
        >
          <div
            className={cn(
              "no-print flex flex-col gap-3",
              compact ? "mb-3" : "mb-6",
              align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
            )}
          >
            <div>
              <h1
                className={cn(
                  "font-display font-medium tracking-tight",
                  compact ? "text-2xl whitespace-nowrap md:text-3xl" : "text-3xl md:text-4xl",
                )}
              >
                {title}
              </h1>
              {description ? (
                <p className={cn("mt-1 text-sm text-muted-foreground", align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl")}>
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className={cn("flex flex-wrap gap-2", align === "center" && "justify-center")}>{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
      <Toaster className="no-print" position="bottom-right" theme={resolved} richColors={false} />
      <RecordSheet />
      <FindTransaction open={findOpen} onClose={() => setFindOpen(false)} />
    </div>
  );
}
