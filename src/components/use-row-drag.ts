import { useState, type DragEvent } from "react";
import { moveId } from "@/lib/finance/sort";

export function useRowDrag(enabled: boolean, ids: string[], onReorder: (ids: string[]) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function bind(id: string) {
    if (!enabled) return {};
    return {
      draggable: true as const,
      onDragStart: () => setDragId(id),
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        setOverId(id);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        if (dragId) onReorder(moveId(ids, dragId, id));
        setDragId(null);
        setOverId(null);
      },
      onDragEnd: () => {
        setDragId(null);
        setOverId(null);
      },
      "data-over": overId === id && dragId && dragId !== id ? "true" : undefined,
    };
  }

  return { bind, dragId, overId };
}
