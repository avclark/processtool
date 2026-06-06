import { createFileRoute } from "@tanstack/react-router";
import { personQueryOptions, usePerson } from "@/lib/queries/people";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/people/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(personQueryOptions(params.id)),
  component: PersonDetailPage,
});

function PersonDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = usePerson(id);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load person.</p>
      </div>
    );
  if (!data)
    return <p className="text-sm text-ink-muted">Person not found.</p>;

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <h1>{data.full_name}</h1>
      </div>

      <div className="mt-6">
        <DataTable>
          <DataRow title="Name">{data.full_name}</DataRow>
          <DataRow title="Email">{data.email}</DataRow>
          <DataRow title="Role">
            <Badge tone="muted">{data.role}</Badge>
          </DataRow>
          <DataRow title="Timezone">{data.timezone ?? "—"}</DataRow>
          <DataRow title="Joined">
            {new Date(data.created_at).toLocaleDateString()}
          </DataRow>
        </DataTable>
      </div>
    </>
  );
}
