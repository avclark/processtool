// Thin behavioral wrapper around dnd-kit for vertical sortable lists. Uses a
// DragOverlay so the dragged item renders in a separate layer (following the
// cursor) instead of re-rendering every list item on every pointer move.
import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export { arrayMove };

export function SortableList({
  ids,
  onReorder,
  renderOverlay,
  children,
}: {
  ids: string[];
  onReorder: (oldIndex: number, newIndex: number) => void;
  // Renders the dragged item in the overlay layer (full opacity, cursor-following).
  renderOverlay?: (activeId: string) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    // 5px activation distance so clicks on in-row buttons aren't treated as drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) onReorder(oldIndex, newIndex);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeId && renderOverlay ? renderOverlay(activeId) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Returns the ref/style for the sortable row and the props to spread onto a
// drag handle (so dragging only starts from the handle, not the whole row).
// With the DragOverlay in use, the in-list source row is dimmed while dragging.
export function useSortableItem(id: string) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    // Disable the post-drop FLIP "settle" animation. We reorder the cache
    // optimistically on drop, so this animation would replay asymmetrically
    // (a visible slide of the passed-over cards on down-drags, nothing on
    // up-drags). With the reorder authoritative, the settle should be instant
    // and identical in both directions. During-drag shifting is unaffected.
    animateLayoutChanges: () => false,
  });

  const style: React.CSSProperties = {
    // Canonical DragOverlay pattern: let dnd-kit position the active item via its
    // normal transform (so neighbors shift consistently), and HIDE the in-list
    // source while dragging — the DragOverlay is the visible moving copy. Hiding
    // it (rather than dimming) prevents the shifting neighbor from rendering on
    // top of a still-painted source row (the up-drag text overlap).
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  // Stable identity so the memoized card row doesn't re-render every pointer
  // move just because a fresh handle-props object was created.
  const handleProps = React.useMemo(
    () => ({ ...attributes, ...listeners }) as React.HTMLAttributes<HTMLElement>,
    [attributes, listeners],
  );

  return { setNodeRef, style, handleProps, isDragging };
}
