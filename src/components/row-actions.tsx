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

/** One primary action on the row; the rest sit in ⋯ so Status is never covered. */
export function RowActions({ primary, items }: { primary?: ReactNode; items?: RowMenuItem[] }) {
  const extra = (items ?? []).filter(Boolean);
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1" onClick={stopOpen} onPointerDown={stopOpen}>
      {primary}
      {extra.length === 1 && !primary ? (
        <Button size="sm" variant="ghost" onClick={extra[0].onSelect}>
          {extra[0].label}
        </Button>
      ) : extra.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" aria-label="More" className="px-2">
              <MoreHorizontal />
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
      ) : null}
    </div>
  );
}
