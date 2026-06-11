import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { episodeQueryOptions, useEpisode } from "@/lib/queries/episodes";
import { useEpisodeTasks } from "@/lib/queries/episodes";
import { usePeople } from "@/lib/queries/people";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blockTypeLabel } from "@/components/processes/block-settings-dialog";
import { DeleteEpisodeDialog } from "@/components/episodes/delete-episode-dialog";
import type { Database } from "@/lib/database.types";

type TaskInstanceBlock =
  Database["public"]["Tables"]["task_instance_blocks"]["Row"];
type TaskInstance = Database["public"]["Tables"]["tasks"]["Row"] & {
  task_instance_blocks: TaskInstanceBlock[];
};

export const Route = createFileRoute("/_shell/episodes/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(episodeQueryOptions(params.id)),
  component: EpisodeDetailPage,
});

function EpisodeDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useEpisode(id);
  const tasks = useEpisodeTasks(id);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load episode.</p>
      </div>
    );
  if (!data) return <p className="text-sm text-ink-muted">Episode not found.</p>;

  const allTasks = (tasks.data ?? []) as TaskInstance[];

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1>{data.title}</h1>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-10">
        <section>
          <DataTable>
            <DataRow title="Status">
              <Badge tone={data.status === "completed" ? "accent" : "neutral"}>
                {data.status}
              </Badge>
            </DataRow>
            <DataRow title="Progress">{data.progress_percent}%</DataRow>
            <DataRow title="Show">{data.shows?.name ?? "—"}</DataRow>
            <DataRow title="Workflow">{data.workflows?.name ?? "—"}</DataRow>
            <DataRow title="Created">
              {new Date(data.created_at).toLocaleDateString()}
            </DataRow>
          </DataTable>
        </section>

        <section>
          <h2 className="mb-4">Tasks</h2>
          <TaskList tasks={tasks} allTasks={allTasks} />
        </section>
      </div>

      <DeleteEpisodeDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        episode={{ id: data.id, title: data.title }}
        taskCount={allTasks.length}
        onDeleted={() =>
          navigate({ to: "/workflows/$id", params: { id: data.workflow_id } })
        }
      />
    </>
  );
}

function TaskList({
  tasks,
  allTasks,
}: {
  tasks: ReturnType<typeof useEpisodeTasks>;
  allTasks: TaskInstance[];
}) {
  const people = usePeople();
  const peopleById = React.useMemo(
    () => new Map((people.data ?? []).map((p) => [p.id, p.full_name])),
    [people.data],
  );

  if (tasks.isLoading)
    return <p className="text-sm text-ink-muted">Loading tasks…</p>;
  if (tasks.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load tasks.</p>
      </div>
    );

  // Render only tasks that currently pass visibility (failing ones are stored
  // but hidden — Phase 7's behavior; live re-eval comes in 7.7).
  const visible = allTasks.filter((t) => t.is_visible);
  const hiddenCount = allTasks.length - visible.length;

  if (allTasks.length === 0)
    return <p className="text-sm text-ink-muted">No tasks in this episode.</p>;

  return (
    <div className="space-y-3">
      {visible.length === 0 ? (
        <p className="text-sm text-ink-muted">No visible tasks.</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
          {visible.map((task) => (
            <li key={task.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-ink-muted">
                  {task.position + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-display">
                  {task.title}
                </span>
                <Badge tone={task.status === "blocked" ? "signal" : "neutral"}>
                  {task.status}
                </Badge>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 pl-9 text-xs text-ink-muted">
                <span>
                  {task.assigned_user_id
                    ? (peopleById.get(task.assigned_user_id) ?? "Unknown")
                    : "Unassigned"}
                </span>
                {task.start_date && (
                  <span>
                    Starts {new Date(task.start_date).toLocaleDateString()}
                  </span>
                )}
                {task.due_date && (
                  <span>
                    Due {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {task.task_instance_blocks.length > 0 && (
                <ul className="mt-2 space-y-1 pl-9">
                  {[...task.task_instance_blocks]
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((block) => (
                      <li
                        key={block.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Badge tone="muted">
                          {blockTypeLabel(block.block_type)}
                        </Badge>
                        <span className="text-ink-body">
                          {block.label || (
                            <span className="italic text-ink-muted">
                              (no label)
                            </span>
                          )}
                        </span>
                        {block.required && <Badge tone="signal">Required</Badge>}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <p className="text-xs text-ink-muted">
          {hiddenCount} task{hiddenCount === 1 ? "" : "s"} hidden by visibility
          rules.
        </p>
      )}
    </div>
  );
}
