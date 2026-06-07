import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskTemplates } from "@/lib/queries/task-templates";
import { useCreateTaskTemplate } from "@/lib/mutations/task-templates";
import { TaskCard } from "@/components/processes/task-card";

interface ProcessBuilderProps {
  processId: string;
}

export function ProcessBuilder({ processId }: ProcessBuilderProps) {
  const { data, isLoading, error } = useTaskTemplates(processId);
  const createTask = useCreateTaskTemplate(processId);
  const [newTitle, setNewTitle] = React.useState("");

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
        <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
          {data.map((template) => (
            <TaskCard
              key={template.id}
              processId={processId}
              template={template}
            />
          ))}
        </ul>
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
