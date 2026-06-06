import { createFileRoute, Link } from "@tanstack/react-router";
import { useProcesses } from "@/lib/queries/processes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/processes/")({
  component: ProcessesPage,
});

function ProcessesPage() {
  const { data, isLoading, error } = useProcesses();

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>Processes</h1>
            <p className="mt-1">Reusable task templates for episodes.</p>
          </div>
          <Button disabled>New Process</Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <p className="text-sm text-ink-muted">Loading processes...</p>
        )}
        {error && (
          <div className="callout callout-danger">
            <p>Failed to load processes.</p>
          </div>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-ink-muted">No processes yet.</p>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
            {data.map((proc) => (
              <li key={proc.id}>
                <Link
                  to="/processes/$id"
                  params={{ id: proc.id }}
                  className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-display">
                      {proc.name}
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      Created{" "}
                      {new Date(proc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge tone="neutral">
                    {proc.taskCount}{" "}
                    {proc.taskCount === 1 ? "task" : "tasks"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
