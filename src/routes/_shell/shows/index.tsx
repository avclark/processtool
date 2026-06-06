import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useShows } from "@/lib/queries/shows";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShowFormDialog } from "@/components/shows/show-form-dialog";

export const Route = createFileRoute("/_shell/shows/")({
  component: ShowsPage,
});

function ShowsPage() {
  const { data, isLoading, error } = useShows();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>Shows</h1>
            <p className="mt-1">All shows in your workspace.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>New Show</Button>
        </div>
      </div>

      <ShowFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="mt-6">
        {isLoading && (
          <p className="text-sm text-ink-muted">Loading shows...</p>
        )}
        {error && (
          <div className="callout callout-danger">
            <p>Failed to load shows.</p>
          </div>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-ink-muted">No shows yet.</p>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
            {data.map((show) => (
              <li key={show.id}>
                <Link
                  to="/shows/$id"
                  params={{ id: show.id }}
                  className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-display">
                      {show.name}
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      Created{" "}
                      {new Date(show.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    tone={show.status === "active" ? "accent" : "muted"}
                  >
                    {show.status}
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
