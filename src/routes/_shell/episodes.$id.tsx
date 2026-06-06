import { createFileRoute } from "@tanstack/react-router";
import { episodeQueryOptions, useEpisode } from "@/lib/queries/episodes";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/episodes/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(episodeQueryOptions(params.id)),
  component: EpisodeDetailPage,
});

function EpisodeDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useEpisode(id);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load episode.</p>
      </div>
    );
  if (!data)
    return <p className="text-sm text-ink-muted">Episode not found.</p>;

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <h1>{data.title}</h1>
      </div>

      <div className="mt-6">
        <DataTable>
          <DataRow title="Title">{data.title}</DataRow>
          <DataRow title="Status">
            <Badge
              tone={data.status === "completed" ? "accent" : "neutral"}
            >
              {data.status}
            </Badge>
          </DataRow>
          <DataRow title="Progress">{data.progress_percent}%</DataRow>
          <DataRow title="Show">{data.shows?.name ?? "—"}</DataRow>
          <DataRow title="Workflow">
            {data.workflows?.name ?? "—"}
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
