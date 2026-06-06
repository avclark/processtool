import { createFileRoute } from "@tanstack/react-router";
import { workflowQueryOptions, useWorkflow } from "@/lib/queries/workflows";
import { DataTable, DataRow } from "@/components/ui/data-table";

export const Route = createFileRoute("/_shell/workflows/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(workflowQueryOptions(params.id)),
  component: WorkflowDetailPage,
});

function WorkflowDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useWorkflow(id);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load workflow.</p>
      </div>
    );
  if (!data)
    return <p className="text-sm text-ink-muted">Workflow not found.</p>;

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <h1>{data.name}</h1>
      </div>

      <div className="mt-6">
        <DataTable>
          <DataRow title="Name">{data.name}</DataRow>
          <DataRow title="Item Label">{data.item_label}</DataRow>
          <DataRow title="Process">
            {data.processes?.name ?? "None"}
          </DataRow>
          <DataRow title="Created">
            {new Date(data.created_at).toLocaleDateString()}
          </DataRow>
          <DataRow title="Updated">
            {new Date(data.updated_at).toLocaleDateString()}
          </DataRow>
        </DataTable>
      </div>
    </>
  );
}
