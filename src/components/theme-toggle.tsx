import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { type ThemeMode, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ id: ThemeMode; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolved, setTheme } = useTheme();
  const dark = resolved === "dark";

  const tip = dark ? "Switch to light" : "Switch to dark";
  return (
    <Tip label={tip}>
      <Button
        variant="outline"
        size={compact ? "icon" : "default"}
        aria-label={tip}
        onClick={() => setTheme(dark ? "light" : "dark")}
      >
        {dark ? <Moon /> : <Sun />}
        {compact ? null : <span className="hidden sm:inline">{dark ? "Dark" : "Light"}</span>}
      </Button>
    </Tip>
  );
}

export function AppearancePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((opt) => {
        const on = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={cn(
              "flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium",
              on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
