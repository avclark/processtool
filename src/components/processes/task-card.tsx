import * as React from "react";
import { ChevronRight, GripVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useRoles } from "@/lib/queries/roles";
import { usePeople } from "@/lib/queries/people";
import {
  useRenameTaskTemplate,
  useDeleteTaskTemplate,
} from "@/lib/mutations/task-templates";
import { AssignmentTab } from "@/components/processes/assignment-tab";
import { BlocksTab } from "@/components/processes/blocks-tab";
import { VisibilityTab } from "@/components/processes/visibility-tab";
import { DependenciesTab } from "@/components/processes/dependencies-tab";
import { DatesTab } from "@/components/processes/dates-tab";
import { ActionsTab } from "@/components/processes/actions-tab";
import { useSortableItem } from "@/components/processes/sortable";
import type { Database } from "@/lib/database.types";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

// Thin sortable wrapper: owns the useSortable subscription + the <li>. This is
// what re-renders on every pointer move during a drag (cheap — just updates the
// <li> style). The heavy TaskCard inside is memoized with stable props, so it
// does NOT re-render during the drag.
export function SortableTaskRow({
  processId,
  template,
}: {
  processId: string;
  template: TaskTemplate;
}) {
  const { setNodeRef, style, handleProps } = useSortableItem(template.id);
  return (
    <li ref={setNodeRef} style={style} className="bg-page">
      <TaskCard
        processId={processId}
        template={template}
        handleProps={handleProps}
      />
    </li>
  );
}

interface TaskCardProps {
  processId: string;
  template: TaskTemplate;
  handleProps: React.HTMLAttributes<HTMLElement>;
}

function TaskCardImpl({ processId, template, handleProps }: TaskCardProps) {
  const roles = useRoles();
  const people = usePeople();
  const renameTask = useRenameTaskTemplate(processId);
  const deleteTask = useDeleteTaskTemplate(processId);

  const [expanded, setExpanded] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(template.title);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  // TEMP INSTRUMENTATION (Phase 6 DnD debug) — remove after diagnosis.
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  console.log("[render] task", {
    title: template.title,
    position: template.position,
    count: renderCount.current,
  });

  const assignmentLabel = getAssignmentLabel(
    template,
    roles.data ?? [],
    people.data ?? [],
  );

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const title = titleDraft.trim();
    if (!title || title === template.title) {
      setEditing(false);
      setTitleDraft(template.title);
      return;
    }
    renameTask.mutate({ id: template.id, title });
    setEditing(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          {...handleProps}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none text-ink-muted hover:text-ink-display active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Collapse task" : "Expand task"}
          aria-expanded={expanded}
          className="cursor-pointer text-ink-muted hover:text-ink-display"
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")}
          />
        </button>

        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-ink-muted">
          {template.position + 1}
        </span>

        {editing ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              autoFocus
            />
            <Button type="submit" size="sm">
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setTitleDraft(template.title);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-display">
              {template.title}
            </span>
            <Badge tone={assignmentLabel.tone}>{assignmentLabel.text}</Badge>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Rename task"
              onClick={() => {
                setTitleDraft(template.title);
                setEditing(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {confirmingDelete ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={deleteTask.isPending}
                  onClick={() => deleteTask.mutate({ id: template.id })}
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete
              </Button>
            )}
          </>
        )}
      </div>

      {expanded && (
        <div className="border-t border-hairline px-4 py-4">
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
              <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
              <TabsTrigger value="dates">Dates</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <BlocksTab templateId={template.id} />
            </TabsContent>
            <TabsContent value="assignment">
              <AssignmentTab processId={processId} template={template} />
            </TabsContent>
            <TabsContent value="visibility">
              <VisibilityTab processId={processId} template={template} />
            </TabsContent>
            <TabsContent value="dependencies">
              <DependenciesTab processId={processId} template={template} />
            </TabsContent>
            <TabsContent value="dates">
              <DatesTab processId={processId} template={template} />
            </TabsContent>
            <TabsContent value="actions">
              <ActionsTab templateId={template.id} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}

// Memoized so it doesn't re-render during a drag (the SortableTaskRow wrapper
// re-renders per move, but passes stable props here). The custom comparator
// re-renders only when a *displayed* field changes — NOT merely when the
// template object reference changes. Background refetches of the byProcess query
// return fresh row objects (and bump updated_at), so a default shallow compare
// would re-render every row whenever a refetch coincides with a drop, flashing
// the text. Ignoring identity (and timestamps) makes display-identical refetches
// a no-op. processId + handleProps are already referentially stable.
const TaskCard = React.memo(TaskCardImpl, (prev, next) => {
  if (prev.processId !== next.processId) return false;
  if (prev.handleProps !== next.handleProps) return false;
  const a = prev.template;
  const b = next.template;
  return (
    a.id === b.id &&
    a.process_id === b.process_id &&
    a.title === b.title &&
    a.description === b.description &&
    a.position === b.position &&
    a.assignment_mode === b.assignment_mode &&
    a.assigned_role_id === b.assigned_role_id &&
    a.assigned_user_id === b.assigned_user_id &&
    a.visibility_logic === b.visibility_logic
  );
});

// Lightweight presentation rendered in the DragOverlay while dragging — the
// card header look, without the sortable wiring / tabs.
export function TaskCardOverlay({ template }: { template: TaskTemplate }) {
  const roles = useRoles();
  const people = usePeople();
  const assignmentLabel = getAssignmentLabel(
    template,
    roles.data ?? [],
    people.data ?? [],
  );
  return (
    <div className="flex items-center gap-3 rounded-md border border-hairline bg-page px-4 py-3 shadow-lg">
      <GripVertical className="h-4 w-4 text-ink-muted" />
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-ink-muted">
        {template.position + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-display">
        {template.title}
      </span>
      <Badge tone={assignmentLabel.tone}>{assignmentLabel.text}</Badge>
    </div>
  );
}

function getAssignmentLabel(
  template: TaskTemplate,
  roles: { id: string; name: string }[],
  people: { id: string; full_name: string }[],
): { text: string; tone: "muted" | "accent" } {
  if (template.assignment_mode === "role" && template.assigned_role_id) {
    const role = roles.find((r) => r.id === template.assigned_role_id);
    return { text: role ? role.name : "Role", tone: "accent" };
  }
  if (template.assignment_mode === "user" && template.assigned_user_id) {
    const person = people.find((p) => p.id === template.assigned_user_id);
    return { text: person ? person.full_name : "Person", tone: "accent" };
  }
  return { text: "Unassigned", tone: "muted" };
}
