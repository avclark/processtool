import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { workflowQueryOptions, useWorkflow } from "@/lib/queries/workflows";
import { useEpisodesByWorkflow } from "@/lib/queries/episodes";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateEpisodeDialog } from "@/components/episodes/create-episode-dialog";

export const Route = createFileRoute("/_shell/workflows/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(workflowQueryOptions(params.id)),
  component: WorkflowDetailPage,
});

function WorkflowDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useWorkflow(id);
  const [createOpen, setCreateOpen] = React.useState(false);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load workflow.</p>
      </div>
    );
  if (!data)
    return <p className="text-sm text-ink-muted">Workflow not found.</p>;

  const hasProcess = !!data.process_id;

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>{data.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {hasProcess
                ? "Create episodes to stamp out this workflow's process."
                : "Assign a process to this workflow before creating episodes."}
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!hasProcess}
            title={hasProcess ? undefined : "This workflow has no process"}
          >
            New Episode
          </Button>
        </div>
      </div>

      {hasProcess && data.process_id && (
        <CreateEpisodeDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          workflowId={id}
          processId={data.process_id}
        />
      )}

      <div className="mt-6">
        <DataTable>
          <DataRow title="Name">{data.name}</DataRow>
          <DataRow title="Item Label">{data.item_label}</DataRow>
          <DataRow title="Process">{data.processes?.name ?? "None"}</DataRow>
          <DataRow title="Created">
            {new Date(data.created_at).toLocaleDateString()}
          </DataRow>
          <DataRow title="Updated">
            {new Date(data.updated_at).toLocaleDateString()}
          </DataRow>
        </DataTable>
      </div>

      <div className="mt-10">
        <h2 className="mb-4">Episodes</h2>
        <EpisodeList workflowId={id} />
      </div>
    </>
  );
}

function EpisodeList({ workflowId }: { workflowId: string }) {
  const { data, isLoading, error } = useEpisodesByWorkflow(workflowId);

  if (isLoading)
    return <p className="text-sm text-ink-muted">Loading episodes…</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load episodes.</p>
      </div>
    );
  if (!data || data.length === 0)
    return <p className="text-sm text-ink-muted">No episodes yet.</p>;

  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
      {data.map((ep) => (
        <li key={ep.id}>
          <Link
            to="/episodes/$id"
            params={{ id: ep.id }}
            className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink-display">
                {ep.title}
              </div>
              <div className="truncate text-xs text-ink-muted">
                {ep.shows?.name ?? "—"} · Created{" "}
                {new Date(ep.created_at).toLocaleDateString()}
              </div>
            </div>
            <Badge tone={ep.status === "completed" ? "accent" : "neutral"}>
              {ep.status}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
