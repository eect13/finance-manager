import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { defaultListLayout, type PhoneLayout } from "@/lib/phone-layout";
import { cn } from "@/lib/utils";

export type ListView = PhoneLayout;

function readListView(storageKey: string): ListView {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "list" || saved === "grid") return saved;
  } catch {
    /* private mode */
  }
  return defaultListLayout();
}

export function useListView(key: string): [ListView, (next: ListView) => void] {
  const storageKey = `finance-manager-${key}-view-v82`;
  const [view, setView] = useState<ListView>(() => readListView(storageKey));
  useEffect(() => {
    setView(readListView(storageKey));
  }, [storageKey]);
  function change(next: ListView) {
    setView(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* private mode */
    }
  }
  return [view, change];
}

export function ViewToggle({ value, onChange }: { value: ListView; onChange: (v: ListView) => void }) {
  return (
    <div className="inline-flex shrink-0 rounded-xl bg-muted p-1 no-print" role="group" aria-label="List or cards">
      {(
        [
          ["list", List, "List"],
          ["grid", LayoutGrid, "Cards"],
        ] as const
      ).map(([id, Icon, label]) => (
        <button
          key={id}
          type="button"
          title={`${label} view`}
          aria-label={label}
          aria-pressed={value === id}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground",
            value === id && "bg-card text-foreground elevation",
          )}
          onClick={() => onChange(id)}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
