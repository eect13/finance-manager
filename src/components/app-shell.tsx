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
  IdCard,
  LayoutDashboard,
  Lock,
  Menu,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Redo2,
  Scale,
  ScrollText,
  Settings,
  Undo2,
  Users,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { bootBooks, useFinanceData, useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import { CompanySwitcher } from "./company-switcher";
import { ExportMenu } from "./export-menu";
import { FindButton, FindTransaction } from "./find-transaction";
import { RecordSheet } from "./record-sheet";
import { PrintStage } from "./print-preview";
import { AppMark } from "./app-mark";
import { ThemeToggle } from "./theme-toggle";
import { applyTheme, useTheme } from "@/lib/theme";
import { APP_VERSION_LABEL } from "@/lib/version";
import { isTypingTarget, redoShortcutLabel, undoShortcutLabel } from "@/lib/hotkey";

const NAV = [
  {
    label: "Treasury",
    items: [
      { to: "/", label: "Desk", icon: LayoutDashboard },
      { to: "/register", label: "Register", icon: BookMarked },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/banks", label: "Banks", icon: Building2 },
      { to: "/reconcile", label: "Reconcile", icon: Scale },
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
    label: "Employees",
    items: [{ to: "/employees", label: "Employees", icon: IdCard }],
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
      { to: "/close", label: "Close", icon: Lock },
    ],
  },
];

const SIDEBAR_KEY = "finance-manager-sidebar";

function readRail() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "rail";
  } catch {
    return false;
  }
}

function NavLinks({
  rail,
  onNavigate,
  embedded = true,
}: {
  rail?: boolean;
  onNavigate?: () => void;
  embedded?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className={cn("flex flex-col gap-6 py-4", embedded ? "sidebar-scroll min-h-0 flex-1" : "shrink-0", rail ? "px-2" : "px-3")}>
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
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center rounded-xl text-sm",
                  rail ? "size-11 justify-center" : "gap-3 px-3",
                  active ? "bg-card text-foreground elevation" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
                title={rail ? item.label : undefined}
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
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("flex items-center gap-2 px-3 py-4", rail && "justify-center px-2")}>
        <AppMark className="size-9" title="Finance Manager" />
        {rail ? null : (
          <div className="min-w-0">
            <p className="font-display text-sm font-medium leading-tight">Finance Manager</p>
            <p className="text-[11px] text-muted-foreground">{APP_VERSION_LABEL}</p>
          </div>
        )}
      </div>
      <NavLinks rail={rail} onNavigate={onNavigate} />
      <div className={cn("mt-auto flex flex-col gap-1 border-t border-border py-3", rail ? "px-2" : "px-3")}>
        {onToggleRail ? (
          <button
            type="button"
            onClick={onToggleRail}
            className={cn(
              "flex min-h-11 items-center rounded-xl text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
              rail ? "size-11 justify-center" : "gap-3 px-3",
            )}
            aria-label={rail ? "Expand menu" : "Collapse menu"}
          >
            {rail ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {rail ? null : "Collapse"}
          </button>
        ) : null}
        <Link
          to="/settings"
          aria-label="Options"
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
          {rail ? null : "Options"}
        </Link>
      </div>
    </div>
  );
}

function ThemeSync() {
  const { theme, resolved } = useTheme();
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme, resolved]);
  return null;
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
  const hydrated = useFinanceStore((s) => s.hydrated);
  const data = useFinanceData();
  const { resolved } = useTheme();
  const canUndo = useFinanceStore((s) => (s.undoStack?.length ?? 0) > 0);
  const canRedo = useFinanceStore((s) => (s.redoStack?.length ?? 0) > 0);
  const undoPeek = useFinanceStore((s) => s.undoStack?.at(-1)?.label ?? "");
  const redoPeek = useFinanceStore((s) => s.redoStack?.at(-1)?.label ?? "");
  const [undoChord, setUndoChord] = useState("Ctrl+Z");
  const [redoChord, setRedoChord] = useState("Ctrl+Y");

  useLayoutEffect(() => {
    setRail(readRail());
  }, []);

  useEffect(() => {
    void bootBooks();
  }, []);

  useEffect(() => {
    setUndoChord(undoShortcutLabel());
    setRedoChord(redoShortcutLabel());
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFindOpen(true);
        return;
      }
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        const undone = useFinanceStore.getState().undo();
        if (undone) toast.success(`Undid: ${undone}`);
        return;
      }
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        const redone = useFinanceStore.getState().redo();
        if (redone) toast.success(`Redid: ${redone}`);
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

  if (!hydrated) {
    return (
      <div className="app-shell-loading flex h-dvh items-center justify-center bg-background text-foreground">
        <ThemeSync />
        <p className="text-sm text-muted-foreground">Opening the books…</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 overflow-hidden bg-background text-foreground">
      <ThemeSync />
      <aside
        className={cn(
          "no-print hidden h-full shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar md:flex",
          rail ? "w-16" : "w-60",
        )}
      >
        <SidebarBody rail={rail} onToggleRail={toggleRail} />
      </aside>

      <div className="app-workspace flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="app-header-bar no-print min-w-0 shrink-0 overflow-x-hidden">
          <div className="flex items-center gap-1 px-3 py-2 sm:gap-3 md:px-8 md:py-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SidebarBody onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1 overflow-hidden">
              <CompanySwitcher />
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <div className="flex">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-r-none"
                  disabled={!canUndo}
                  aria-label={undoPeek ? `Undo: ${undoPeek} (${undoChord})` : `Undo ${undoChord}`}
                  title={undoPeek ? `Undo: ${undoPeek} (${undoChord})` : `Undo ${undoChord}`}
                  onClick={() => {
                    const undone = useFinanceStore.getState().undo();
                    if (undone) toast.success(`Undid: ${undone}`);
                  }}
                >
                  <Undo2 />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="-ml-px rounded-l-none"
                  disabled={!canRedo}
                  aria-label={redoPeek ? `Redo: ${redoPeek} (${redoChord})` : `Redo ${redoChord}`}
                  title={redoPeek ? `Redo: ${redoPeek} (${redoChord})` : `Redo ${redoChord}`}
                  onClick={() => {
                    const redone = useFinanceStore.getState().redo();
                    if (redone) toast.success(`Redid: ${redone}`);
                  }}
                >
                  <Redo2 />
                </Button>
              </div>
              <FindButton onClick={() => setFindOpen(true)} />
              <ThemeToggle compact />
              <ExportMenu data={data} />
            </div>
          </div>
        </header>

        <main
          data-workspace-scroll
          className={cn(
            "mx-auto w-full min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8",
            wide ? "max-w-none" : "max-w-6xl",
          )}
        >
          <div
            className={cn(
              "no-print flex flex-col gap-3",
              compact ? "mb-3" : "mb-4 sm:mb-6",
              align === "center" ? "items-stretch text-left sm:items-center sm:text-center" : "sm:flex-row sm:items-end sm:justify-between",
            )}
          >
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-display font-medium tracking-tight",
                  compact ? "text-xl sm:text-2xl md:text-3xl" : "text-2xl sm:text-3xl md:text-4xl",
                )}
              >
                {title}
              </h1>
              {description ? (
                <p className={cn("app-page-hint mt-1 text-sm text-muted-foreground", align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl")}>
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className={cn("page-actions", align === "center" && "sm:justify-center")}>{actions}</div> : null}
          </div>
          <div className="min-w-0 max-w-full">{children}</div>
        </main>
      </div>
      <Toaster className="no-print" position="bottom-right" theme={resolved} richColors={false} />
      <RecordSheet />
      <PrintStage />
      <FindTransaction open={findOpen} onClose={() => setFindOpen(false)} />
    </div>
  );
}
