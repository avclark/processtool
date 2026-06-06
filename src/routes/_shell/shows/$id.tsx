import { createFileRoute } from "@tanstack/react-router";
import { showQueryOptions, useShow } from "@/lib/queries/shows";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/shows/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(showQueryOptions(params.id)),
  component: ShowDetailPage,
});

function ShowDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useShow(id);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load show.</p>
      </div>
    );
  if (!data) return <p className="text-sm text-ink-muted">Show not found.</p>;

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <h1>{data.name}</h1>
      </div>

      <div className="mt-6">
        <DataTable>
          <DataRow title="Name">{data.name}</DataRow>
          <DataRow title="Slug">{data.slug}</DataRow>
          <DataRow title="Status">
            <Badge tone={data.status === "active" ? "accent" : "muted"}>
              {data.status}
            </Badge>
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
