import { createFileRoute } from "@tanstack/react-router";
import { processQueryOptions, useProcess } from "@/lib/queries/processes";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/processes/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(processQueryOptions(params.id)),
  component: ProcessDetailPage,
});

function ProcessDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useProcess(id);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load process.</p>
      </div>
    );
  if (!data)
    return <p className="text-sm text-ink-muted">Process not found.</p>;

  const templates = data.task_templates ?? [];

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <h1>{data.name}</h1>
      </div>

      <div className="mt-6">
        <DataTable>
          <DataRow title="Name">{data.name}</DataRow>
          <DataRow title="Created">
            {new Date(data.created_at).toLocaleDateString()}
          </DataRow>
          <DataRow title="Updated">
            {new Date(data.updated_at).toLocaleDateString()}
          </DataRow>
        </DataTable>
      </div>

      <div className="mt-8">
        <h2>
          Task Templates{" "}
          <Badge tone="neutral">{templates.length}</Badge>
        </h2>
        {templates.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            No task templates defined.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
            {templates
              .sort((a, b) => a.position - b.position)
              .map((t) => (
                <li key={t.id} className="px-4 py-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-ink-muted">
                      {t.position}.
                    </span>
                    <span className="text-ink-display">{t.title}</span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </>
  );
}
