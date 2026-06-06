import { createFileRoute, Link } from "@tanstack/react-router";
import { useWorkflows } from "@/lib/queries/workflows";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/workflows/")({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const { data, isLoading, error } = useWorkflows();

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>Workflows</h1>
            <p className="mt-1">Workflow templates for your shows.</p>
          </div>
          <Button disabled>New Workflow</Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <p className="text-sm text-ink-muted">Loading workflows...</p>
        )}
        {error && (
          <div className="callout callout-danger">
            <p>Failed to load workflows.</p>
          </div>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-ink-muted">No workflows yet.</p>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
            {data.map((wf) => (
              <li key={wf.id}>
                <Link
                  to="/workflows/$id"
                  params={{ id: wf.id }}
                  className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-display">
                      {wf.name}
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      {wf.item_label}
                      {wf.processes?.name
                        ? ` · Process: ${wf.processes.name}`
                        : ""}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
