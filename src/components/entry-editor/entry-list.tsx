"use client";

import { useState, type HTMLAttributes, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Generic reorderable list shell: renders an "Add" button above and below
 * the list (so it's reachable without scrolling past a long list either
 * way), and - when `reorderable` - native HTML5 drag-and-drop between
 * entries via a drag handle each `renderItem` call receives. Shared by every
 * entry-list section in both the knowledge-base editor and the resume
 * editor; only `renderItem`'s field markup differs per section.
 */
export function EntryList<T>({
  items,
  onAdd,
  addLabel,
  onReorder,
  reorderable = false,
  renderItem,
}: {
  items: T[];
  onAdd: () => void;
  addLabel: string;
  onReorder?: (next: T[]) => void;
  reorderable?: boolean;
  renderItem: (
    item: T,
    index: number,
    dragHandleProps?: HTMLAttributes<HTMLSpanElement>,
  ) => ReactNode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDrop(index: number) {
    if (onReorder && dragIndex !== null && dragIndex !== index) {
      const next = items.slice();
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      onReorder(next);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  const addButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit"
      onClick={onAdd}
    >
      <Plus className="size-3.5" />
      {addLabel}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      {addButton}
      {items.map((item, i) => (
        <div
          key={i}
          onDragOver={
            reorderable
              ? (e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }
              : undefined
          }
          onDrop={reorderable ? () => handleDrop(i) : undefined}
          className={cn(
            "rounded-xl transition-opacity",
            dragIndex === i && "opacity-40",
            reorderable &&
              overIndex === i &&
              dragIndex !== null &&
              dragIndex !== i &&
              "ring-2 ring-ring",
          )}
        >
          {renderItem(
            item,
            i,
            reorderable
              ? {
                  draggable: true,
                  onDragStart: () => setDragIndex(i),
                  onDragEnd: () => {
                    setDragIndex(null);
                    setOverIndex(null);
                  },
                }
              : undefined,
          )}
        </div>
      ))}
      {items.length > 0 && addButton}
    </div>
  );
}
