import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskTemplates } from "@/lib/queries/task-templates";
import {
  useCreateTaskTemplate,
  useReorderTaskTemplates,
} from "@/lib/mutations/task-templates";
import {
  SortableTaskRow,
  TaskCardOverlay,
} from "@/components/processes/task-card";
import { SortableList, arrayMove } from "@/components/processes/sortable";

interface ProcessBuilderProps {
  processId: string;
}

export function ProcessBuilder({ processId }: ProcessBuilderProps) {
  const { data, isLoading, error } = useTaskTemplates(processId);
  const createTask = useCreateTaskTemplate(processId);
  const reorder = useReorderTaskTemplates(processId);
  const [newTitle, setNewTitle] = React.useState("");

  // Stable identity for SortableContext's `items`: only changes when the order
  // actually changes (the drop), NOT on incidental re-renders (e.g. the
  // mutation's pending→settled toggle). A fresh `data.map()` every render would
  // make dnd-kit re-measure and replay a layout animation on those incidental
  // renders, producing a spurious secondary move/flash after the drop. This
  // matches the official dnd-kit pattern of passing a referentially-stable items.
  const ids = React.useMemo(() => (data ?? []).map((t) => t.id), [data]);
  const byId = React.useMemo(
    () => new Map((data ?? []).map((t) => [t.id, t])),
    [data],
  );

  function handleReorder(oldIndex: number, newIndex: number) {
    const after = arrayMove(ids, oldIndex, newIndex);
    // TEMP INSTRUMENTATION (Phase 6 DnD debug) — remove after diagnosis.
    console.log("[dnd] reorder", { oldIndex, newIndex, before: [...ids], after });
    reorder.mutate(after);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createTask.mutate({ title });
    setNewTitle("");
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <p className="text-sm text-ink-muted">Loading task templates…</p>
      )}
      {error && (
        <div className="callout callout-danger">
          <p>Failed to load task templates.</p>
        </div>
      )}

      {data && data.length === 0 && (
        <p className="text-sm text-ink-muted">
          No task templates yet. Add the first one below.
        </p>
      )}

      {data && data.length > 0 && (
        <SortableList
          ids={ids}
          onReorder={handleReorder}
          renderOverlay={(id) => {
            const t = byId.get(id);
            return t ? <TaskCardOverlay template={t} /> : null;
          }}
        >
          <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
            {data.map((template) => (
              <SortableTaskRow
                key={template.id}
                processId={processId}
                template={template}
              />
            ))}
          </ul>
        </SortableList>
      )}

      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <label htmlFor="new-task">Add task template</label>
          <Input
            id="new-task"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Record episode"
          />
        </div>
        <Button type="submit" disabled={createTask.isPending}>
          Add task
        </Button>
      </form>
    </div>
  );
}
