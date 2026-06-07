import * as React from "react";
import { ChevronRight, Pencil } from "lucide-react";
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
import type { Database } from "@/lib/database.types";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

interface TaskCardProps {
  processId: string;
  template: TaskTemplate;
}

export function TaskCard({ processId, template }: TaskCardProps) {
  const roles = useRoles();
  const people = usePeople();
  const renameTask = useRenameTaskTemplate(processId);
  const deleteTask = useDeleteTaskTemplate(processId);

  const [expanded, setExpanded] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(template.title);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

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
    <li className="bg-page">
      <div className="flex items-center gap-3 px-4 py-3">
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
    </li>
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
