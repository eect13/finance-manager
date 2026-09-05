import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CashLine } from "@/lib/finance/register";
import { useFinanceStore } from "@/lib/finance/store";
import type { Bank } from "@/lib/finance/types";

function holdingBank(banks: Bank[]): Bank | undefined {
  return banks.find((b) => /safe|undeposit|hold|petty/i.test(`${b.nickname} ${b.name}`));
}

function operatingBank(banks: Bank[], exceptId?: string): Bank | undefined {
  const rest = banks.filter((b) => b.id !== exceptId);
  return rest.find((b) => /operat|checking/i.test(`${b.nickname} ${b.name}`)) ?? rest[0];
}

export function RegisterSwap({
  banks,
  lines,
  selectedIds,
  preferFromId,
  onMoved,
  compact: _compact = false,
}: {
  banks: Bank[];
  lines: CashLine[];
  selectedIds: string[];
  preferFromId?: string;
  onSelectIds: (ids: string[]) => void;
  onMoved: () => void;
  /** Inline To + Move only (parent owns count / Clear / Delete). */
  compact?: boolean;
}) {
  const reassignCashBanks = useFinanceStore((s) => s.reassignCashBanks);
  const live = useMemo(() => banks.filter((b) => !b.archived), [banks]);
  const holdId = holdingBank(live)?.id ?? live[0]?.id ?? "";
  const seedFrom = preferFromId && live.some((b) => b.id === preferFromId) ? preferFromId : holdId;
  const [fromId, setFromId] = useState(seedFrom);
  const [toId, setToId] = useState(() => operatingBank(live, seedFrom)?.id ?? "");

  const selectedBankIds = useMemo(() => {
    const set = new Set(selectedIds);
    return [...new Set(lines.filter((l) => set.has(l.id) && l.reassignable).map((l) => l.bankId))];
  }, [lines, selectedIds]);

  useEffect(() => {
    if (selectedBankIds.length === 1 && selectedBankIds[0]) {
      setFromId(selectedBankIds[0]);
      return;
    }
    if (preferFromId && live.some((b) => b.id === preferFromId)) {
      setFromId(preferFromId);
      return;
    }
    if (!fromId && holdId) setFromId(holdId);
  }, [preferFromId, holdId, fromId, live, selectedBankIds]);

  useEffect(() => {
    if (toId && toId !== fromId && live.some((b) => b.id === toId)) return;
    const next = operatingBank(live, fromId);
    if (next) setToId(next.id);
  }, [fromId, toId, live]);

  const picked = useMemo(() => {
    const set = new Set(selectedIds);
    return lines.filter((l) => l.reassignable && set.has(l.id) && l.bankId !== toId);
  }, [lines, selectedIds, toId]);
  const toName = live.find((b) => b.id === toId)?.nickname ?? "bank";
  const count = picked.length;
  const ready = Boolean(fromId && toId && fromId !== toId && count > 0);

  function run() {
    if (!ready) return;
    try {
      reassignCashBanks(
        picked.map((l) => ({ kind: l.kind, sourceId: l.sourceId, fromBankId: l.bankId })),
        toId,
      );
      toast.success(
        count === 1
          ? `${picked[0].party} moved to ${toName}.`
          : `${count} lines moved to ${toName}.`,
      );
      onMoved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not swap bank.");
    }
  }

  if (live.length < 2) return null;
  if (selectedIds.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">To</span>
      <Select value={toId} onValueChange={setToId}>
        <SelectTrigger className="h-9 min-h-9 w-[min(100%,10rem)] sm:w-40" aria-label="To bank">
          <SelectValue placeholder="To bank" />
        </SelectTrigger>
        <SelectContent>
          {live
            .filter((b) => b.id !== fromId)
            .map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nickname}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Button className="w-fit shrink-0" size="sm" disabled={!ready} onClick={run}>
        <ArrowLeftRight />
        Move
      </Button>
    </div>
  );
}
