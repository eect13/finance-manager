import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { ShopTick } from "@/components/shop-tick";
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
  onSelectIds,
  onMoved,
}: {
  banks: Bank[];
  lines: CashLine[];
  selectedIds: string[];
  preferFromId?: string;
  onSelectIds: (ids: string[]) => void;
  onMoved: () => void;
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

  const onFrom = useMemo(
    () => lines.filter((l) => l.reassignable && l.bankId === fromId && l.bankId !== toId),
    [lines, fromId, toId],
  );
  const picked = useMemo(() => {
    if (selectedIds.length === 0) return onFrom;
    const set = new Set(selectedIds);
    return lines.filter((l) => l.reassignable && set.has(l.id) && l.bankId !== toId);
  }, [lines, selectedIds, toId, onFrom]);
  const usingSelection = selectedIds.length > 0;
  const fromName = live.find((b) => b.id === fromId)?.nickname ?? "bank";
  const toName = live.find((b) => b.id === toId)?.nickname ?? "bank";
  const allFromOn = onFrom.length > 0 && onFrom.every((l) => selectedIds.includes(l.id));
  const someFromOn = onFrom.some((l) => selectedIds.includes(l.id)) && !allFromOn;
  const count = picked.length;
  const ready = Boolean(fromId && toId && fromId !== toId && count > 0);

  function toggleFrom(on: boolean) {
    const fromSet = new Set(onFrom.map((l) => l.id));
    if (on) {
      onSelectIds([...new Set([...selectedIds, ...fromSet])]);
      return;
    }
    onSelectIds(selectedIds.filter((id) => !fromSet.has(id)));
  }

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
    <div className="no-print flex flex-col gap-2 rounded-xl bg-card p-2 elevation sm:flex-row sm:flex-wrap sm:items-center">
      <ShopTick
        checked={allFromOn}
        indeterminate={someFromOn}
        onChange={toggleFrom}
        label={`Select all on ${fromName}`}
      />
      <p className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Move</p>
      <Select value={fromId} onValueChange={setFromId}>
        <SelectTrigger className="h-9 min-h-9 sm:w-40" aria-label="From bank">
          <SelectValue placeholder="From bank" />
        </SelectTrigger>
        <SelectContent>
          {live.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.nickname}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="hidden px-1 text-muted-foreground sm:inline" aria-hidden>
        →
      </span>
      <Select value={toId} onValueChange={setToId}>
        <SelectTrigger className="h-9 min-h-9 sm:w-40" aria-label="To bank">
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
      <p className="text-xs text-muted-foreground">
        {usingSelection
          ? `${selectedIds.length} selected`
          : count === 0
            ? `None on ${fromName}`
            : `All ${count} on ${fromName}`}
      </p>
      <Button className="w-fit shrink-0 sm:ml-auto" size="sm" disabled={!ready} onClick={run}>
        <ArrowLeftRight />
        {count === 0
          ? `Nothing to move`
          : usingSelection
            ? `Move ${count} to ${toName}`
            : `Move all ${count} to ${toName}`}
      </Button>
    </div>
  );
}
