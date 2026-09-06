import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
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
  id,
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
  id?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(valueName);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [box, setBox] = useState({ top: 0, left: 0, width: 280 });

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

  function layout() {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const height = 224;
    const spaceBelow = window.innerHeight - r.bottom - 8;
    const spaceAbove = r.top - 8;
    let top = r.bottom + 4;
    if (spaceBelow < 120 && spaceAbove > spaceBelow) {
      top = Math.max(8, r.top - height - 4);
    }
    setBox({ top, left: r.left, width: Math.max(r.width, 160) });
  }

  useLayoutEffect(() => {
    if (!open) return;
    layout();
    function onScroll() {
      layout();
    }
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
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
      {open && (matches.length > 0 || canCreate)
        ? createPortal(
            <ul
              data-party-list
              className="fixed max-h-40 overflow-y-auto rounded-xl bg-popover p-1 elevation sm:max-h-56"
              style={{ top: box.top, left: box.left, width: box.width, zIndex: 90, pointerEvents: "auto" }}
            >
              {matches.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={cn(
                      "flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm",
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
                      "flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm font-medium",
                      hi === matches.length ? "bg-accent" : "hover:bg-muted",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addNew}
                  >
                    Quick Add “{q}”
                  </button>
                </li>
              ) : null}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
