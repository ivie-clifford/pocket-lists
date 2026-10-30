import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVertical } from "./dnd-modifiers";
import { GripVertical } from "lucide-react";
import type { PocketItem } from "@/lib/pocket/types";
import { usePocket } from "@/lib/pocket/store";
import { ItemRow } from "./ItemRow";

export function SortableItems({ listId, items }: { listId: string; items: PocketItem[] }) {
  const { reorderItems } = usePocket();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    reorderItems(listId, arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} modifiers={[restrictToVertical]}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div role="list">
          {items.map((i) => (
            <SortableRow key={i.id} item={i} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ item }: { item: PocketItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 rounded-xl bg-card shadow-md" : undefined}
    >
      <ItemRow
        item={item}
        handle={
          <button
            {...attributes}
            {...listeners}
            aria-label={`Reorder "${item.text}"`}
            className="grid h-12 w-10 shrink-0 touch-none place-items-center text-ink-soft/50"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        }
      />
    </div>
  );
}
