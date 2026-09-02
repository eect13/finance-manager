import { useEffect, useMemo, useState, type RefObject } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PartyCombo({
  items,
  valueId,
  valueName,
  disabled,
  inputRef,
  placeholder = "Type a name",
  label = "Name",
  onChoose,
  onName,
  onCreate,
  invalid,
}: {
  items: Array<{ id: string; name: string }>;
  valueId: string;
  valueName: string;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  placeholder?: string;
  label?: string;
  onChoose: (id: string, name: string) => void;
  onName?: (name: string) => void;
  onCreate?: (name: string) => { id: string; name: string };
  invalid?: boolean;
}) {
  const [query, setQuery] = useState(valueName);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);

  useEffect(() => {
    if (!open) setQuery(valueName);
  }, [valueName, open]);

  const q = query.trim();
  const matches = useMemo(() => {
    const needle = q.toLowerCase();
    const rows = needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items;
    return rows.slice(0, 12);
  }, [items, q]);

  const exact = q ? items.some((item) => item.name.toLowerCase() === q.toLowerCase()) : true;
  const canCreate = Boolean(onCreate && q && !exact);
  const rows = canCreate ? matches.length + 1 : matches.length;

  function pick(id: string, name: string) {
    onChoose(id, name);
    setQuery(name);
    setOpen(false);
  }

  function addNew() {
    if (!onCreate || !q) return;
    const created = onCreate(q);
    pick(created.id, created.name);
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={open ? query : valueName}
        disabled={disabled}
        autoComplete="off"
        placeholder={placeholder}
        className={cn(invalid && "border-destructive")}
        aria-label={label}
        onFocus={(e) => {
          setOpen(true);
          setQuery(valueName);
          e.target.select();
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          onName?.(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHi((n) => Math.min(rows - 1, n + 1));
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((n) => Math.max(0, n - 1));
            return;
          }
          if (e.key === "Enter" && open) {
            if (canCreate && hi === matches.length) {
              e.preventDefault();
              e.stopPropagation();
              addNew();
              return;
            }
            if (matches[hi]) {
              e.preventDefault();
              e.stopPropagation();
              pick(matches[hi].id, matches[hi].name);
            }
          }
        }}
      />
      {open && (matches.length > 0 || canCreate) ? (
        <ul
          data-party-list
          className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-xl bg-popover p-1 elevation sm:max-h-56"
        >
          {matches.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                tabIndex={-1}
                className={cn(
                  "flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm",
                  i === hi || item.id === valueId ? "bg-accent" : "hover:bg-muted",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(item.id, item.name)}
              >
                {item.name}
              </button>
            </li>
          ))}
          {canCreate ? (
            <li>
              <button
                type="button"
                tabIndex={-1}
                className={cn(
                  "flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium",
                  hi === matches.length ? "bg-accent" : "hover:bg-muted",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={addNew}
              >
                + Add “{q}”
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
