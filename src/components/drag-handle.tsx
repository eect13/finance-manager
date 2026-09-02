import { GripVertical } from "lucide-react";
import type { DragEvent } from "react";
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

export function setCashDragImage(e: DragEvent, label: string) {
  const ghost = document.createElement("div");
  ghost.className = "register-drag-ghost";
  ghost.textContent = label;
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 16, 16);
  requestAnimationFrame(() => ghost.remove());
}
