import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reorderList } from "@/lib/finance/sort";
import { cn } from "@/lib/utils";

export interface DraftLine {
  description: string;
  quantity: string;
  unitPrice: string;
}

export function EntryLines({
  lines,
  onChange,
  dragEnabled,
}: {
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
  dragEnabled: boolean;
}) {
  function patch(index: number, next: Partial<DraftLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...next } : line)));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Lines</p>
      {lines.map((line, index) => (
        <div
          key={index}
          className={cn("grid gap-2 sm:grid-cols-[auto_1fr_80px_110px_auto]", dragEnabled && "items-center")}
          draggable={dragEnabled}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", String(index));
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const from = Number(e.dataTransfer.getData("text/plain"));
            if (Number.isFinite(from)) onChange(reorderList(lines, from, index));
          }}
        >
          {dragEnabled ? (
            <span className="hidden cursor-grab text-muted-foreground sm:flex" aria-hidden>
              <GripVertical className="size-4" />
            </span>
          ) : (
            <span className="hidden sm:block" />
          )}
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => patch(index, { description: e.target.value })}
          />
          <Input
            placeholder="Qty"
            value={line.quantity}
            onChange={(e) => patch(index, { quantity: e.target.value })}
          />
          <Input
            placeholder="Unit price"
            value={line.unitPrice}
            onChange={(e) => patch(index, { unitPrice: e.target.value })}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-11"
            aria-label="Remove line"
            disabled={lines.length <= 1}
            onClick={() => onChange(lines.filter((_, i) => i !== index))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => onChange([...lines, { description: "", quantity: "1", unitPrice: "" }])}
      >
        <Plus />
        Add line
      </Button>
    </div>
  );
}
