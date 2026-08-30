import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function DragHandle({ enabled, className }: { enabled: boolean; className?: string }) {
  if (!enabled) return null;
  return (
    <span
      className={cn("inline-flex cursor-grab text-muted-foreground active:cursor-grabbing", className)}
      aria-label="Drag to reorder"
    >
      <GripVertical className="size-4" />
    </span>
  );
}
