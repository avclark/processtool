import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTaskTemplates } from "@/lib/queries/task-templates";
import { useDependencies } from "@/lib/queries/dependencies";
import { useSaveDependencies } from "@/lib/mutations/dependencies";
import type { Database } from "@/lib/database.types";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

interface DependenciesTabProps {
  processId: string;
  template: TaskTemplate;
}

export function DependenciesTab({ processId, template }: DependenciesTabProps) {
  const templates = useTaskTemplates(processId);
  const deps = useDependencies(template.id);
  const save = useSaveDependencies(template.id);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (deps.data)
      setSelectedIds(deps.data.map((d) => d.depends_on_task_template_id));
  }, [deps.data]);

  const others = (templates.data ?? []).filter((t) => t.id !== template.id);
  const titleById = new Map(others.map((t) => [t.id, t.title]));
  const available = others.filter((t) => !selectedIds.includes(t.id));

  if (templates.isLoading || deps.isLoading)
    return <p className="text-sm text-ink-muted">Loading…</p>;
  if (templates.error || deps.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load dependencies.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        This task is blocked until the selected tasks are completed.
      </p>

      {selectedIds.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No dependencies — this task is available immediately.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1">
              <Badge tone="muted">
                {titleById.get(id) ?? "Unknown task"}
              </Badge>
              <button
                type="button"
                aria-label="Remove dependency"
                onClick={() =>
                  setSelectedIds((prev) => prev.filter((x) => x !== id))
                }
                className="cursor-pointer text-ink-muted hover:text-ink-display"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {available.length > 0 && (
          <Select
            className="sm:max-w-xs"
            value=""
            onChange={(e) => {
              if (e.target.value)
                setSelectedIds((prev) => [...prev, e.target.value]);
            }}
            aria-label="Add dependency"
          >
            <option value="">Add a prerequisite task…</option>
            {available.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        )}
        <Button
          type="button"
          onClick={() => save.mutate(selectedIds)}
          disabled={save.isPending}
        >
          {save.isPending ? "Saving…" : "Save dependencies"}
        </Button>
      </div>
    </div>
  );
}
