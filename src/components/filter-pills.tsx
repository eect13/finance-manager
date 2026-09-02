import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ListToolbar({
  query,
  onQuery,
  placeholder,
  label,
  children,
}: {
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="register-toolbar no-print mb-3">
      <Input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={placeholder}
        className="register-toolbar-search h-11 min-h-11"
        aria-label={label}
      />
      <div className="register-toolbar-actions">{children}</div>
    </div>
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
  label = "Filter",
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("filter-pills no-print", className)} role="group" aria-label={label}>
      {options.map((opt) => (
        <Button
          key={opt.id}
          type="button"
          size="sm"
          variant={value === opt.id ? "default" : "ghost"}
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

export type DirSort = "name-asc" | "name-desc" | "balance-desc" | "balance-asc";

export function cycleDirSort(current: DirSort): DirSort {
  if (current === "name-asc") return "name-desc";
  if (current === "name-desc") return "balance-desc";
  if (current === "balance-desc") return "balance-asc";
  return "name-asc";
}

export function dirSortLabel(sort: DirSort) {
  if (sort === "name-desc") return "Name Z–A";
  if (sort === "balance-desc") return "Balance high–low";
  if (sort === "balance-asc") return "Balance low–high";
  return "Name A–Z";
}
