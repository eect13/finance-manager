import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { stopOpen } from "@/lib/finance/open-record";

export type RowMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

/** Primary action stays on the row. Extra items go in ⋯ — except delete-only menus, which render Delete on the row. */
export function RowActions({ primary, items }: { primary?: ReactNode; items?: RowMenuItem[] }) {
  const extra = (items ?? []).filter(Boolean);
  const deleteOnly = extra.length > 0 && extra.every((i) => i.danger);

  return (
    <div className="flex flex-nowrap items-center justify-end gap-1" onClick={stopOpen} onPointerDown={stopOpen}>
      {primary}
      {deleteOnly
        ? extra.map((item) => (
            <Button
              key={item.label}
              size="sm"
              variant="outline"
              className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={item.onSelect}
            >
              {item.label}
            </Button>
          ))
        : extra.length > 0
          ? (
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
                  {extra.map((item) => (
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
            )
          : null}
    </div>
  );
}
