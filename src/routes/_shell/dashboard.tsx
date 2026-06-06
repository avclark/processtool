import { createFileRoute, Link } from "@tanstack/react-router";
import { useShows } from "@/lib/queries/shows";
import { useWorkflows } from "@/lib/queries/workflows";
import { useProcesses } from "@/lib/queries/processes";
import { usePeople } from "@/lib/queries/people";
import { useEpisodes } from "@/lib/queries/episodes";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const shows = useShows();
  const workflows = useWorkflows();
  const processes = useProcesses();
  const people = usePeople();
  const episodes = useEpisodes();

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <h1>Dashboard</h1>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Shows"
          value={shows.data?.length}
          loading={shows.isLoading}
          to="/shows"
        />
        <StatCard
          label="Workflows"
          value={workflows.data?.length}
          loading={workflows.isLoading}
          to="/workflows"
        />
        <StatCard
          label="Processes"
          value={processes.data?.length}
          loading={processes.isLoading}
          to="/processes"
        />
        <StatCard
          label="People"
          value={people.data?.length}
          loading={people.isLoading}
          to="/people"
        />
      </div>

      <div className="mt-10">
        <h2>Recent Episodes</h2>
        <div className="mt-4">
          {episodes.isLoading && (
            <p className="text-sm text-ink-muted">Loading episodes...</p>
          )}
          {episodes.error && (
            <div className="callout callout-danger">
              <p>Failed to load episodes.</p>
            </div>
          )}
          {episodes.data && episodes.data.length === 0 && (
            <p className="text-sm text-ink-muted">No episodes yet.</p>
          )}
          {episodes.data && episodes.data.length > 0 && (
            <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
              {episodes.data.slice(0, 10).map((ep) => (
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
                        {ep.shows?.name ?? "—"}
                      </div>
                    </div>
                    <Badge
                      tone={ep.status === "completed" ? "accent" : "neutral"}
                    >
                      {ep.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  loading,
  to,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-hairline bg-page p-4 no-underline hover:bg-surface"
    >
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-ink-display">
        {loading ? "—" : (value ?? 0)}
      </div>
    </Link>
  );
}
