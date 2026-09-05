import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { stopOpen } from "@/lib/finance/open-record";
import { usePhoneUi } from "@/lib/phone-layout";

export type RowMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

/** Desk with room: at most this many extras render as buttons; more go in ⋯. */
const DESK_INLINE_MAX = 2;
/** Below this width, extras (Delete, …) fold into ⋯. ~Delete sm button. */
const INLINE_FIT_MIN = 84;
/** Below this, a primary (Collect / Pay) also folds into ⋯. */
const PRIMARY_FIT_MIN = 120;

function ItemButton({ item }: { item: RowMenuItem }) {
  return (
    <Button
      size="sm"
      variant="outline"
      className={
        item.danger
          ? "shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          : "shrink-0"
      }
      onClick={item.onSelect}
    >
      {item.label}
    </Button>
  );
}

function MoreMenu({ items }: { items: RowMenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          aria-label="More actions"
          title="More actions"
          className="size-8 shrink-0 px-0 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.onSelect}
            className={item.danger ? "text-destructive" : undefined}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Primary stays on the row when it fits.
 * Desk: ≤2 extras as buttons when the actions cell is wide enough; else ⋯.
 * Phone / narrow: extras in compact ⋯; fold primary into ⋯ when the cell is too tight.
 */
export function RowActions({
  primary,
  primaryAsItem,
  items,
}: {
  primary?: ReactNode;
  /** Used when primary is folded into ⋯ (narrow actions cell). */
  primaryAsItem?: RowMenuItem;
  items?: RowMenuItem[];
}) {
  const phone = usePhoneUi();
  const rootRef = useRef<HTMLDivElement>(null);
  // Default sensible: desk assumes room (buttons), phone assumes ⋯ — no first-paint flash.
  const [narrow, setNarrow] = useState(false);
  const [primaryNarrow, setPrimaryNarrow] = useState(false);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      setNarrow(w < INLINE_FIT_MIN);
      setPrimaryNarrow(w < PRIMARY_FIT_MIN);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const extra = (items ?? []).filter(Boolean);
  const foldPrimary = Boolean(primary) && !phone && primaryNarrow;
  const showInline = !phone && !narrow && extra.length > 0 && extra.length <= DESK_INLINE_MAX;
  const menuItems: RowMenuItem[] =
    foldPrimary && primaryAsItem ? [primaryAsItem, ...extra] : extra;
  const showMenu = menuItems.length > 0 && (foldPrimary || !showInline);
  const showPrimary = Boolean(primary) && !foldPrimary;

  return (
    <div
      ref={rootRef}
      className="flex w-full min-w-0 flex-nowrap items-center justify-end gap-1"
      onClick={stopOpen}
      onPointerDown={stopOpen}
    >
      {showPrimary ? primary : null}
      {showInline && !foldPrimary
        ? extra.map((item) => <ItemButton key={item.label} item={item} />)
        : showMenu
          ? <MoreMenu items={menuItems} />
          : null}
    </div>
  );
}

/** Delete-only row control — desk button when it fits, else ⋯ via RowActions. */
export function RowDeleteButton({ onDelete, label = "Delete" }: { onDelete: () => void; label?: string }) {
  return <RowActions items={[{ label, onSelect: onDelete, danger: true }]} />;
}
