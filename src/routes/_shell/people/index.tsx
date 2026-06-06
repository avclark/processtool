import { createFileRoute, Link } from "@tanstack/react-router";
import { usePeople } from "@/lib/queries/people";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/people/")({
  component: PeoplePage,
});

function PeoplePage() {
  const { data, isLoading, error } = usePeople();

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>People</h1>
            <p className="mt-1">Team members and their roles.</p>
          </div>
          <Button disabled>Invite</Button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <p className="text-sm text-ink-muted">Loading people...</p>
        )}
        {error && (
          <div className="callout callout-danger">
            <p>Failed to load people.</p>
          </div>
        )}
        {data && data.length === 0 && (
          <p className="text-sm text-ink-muted">No people yet.</p>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
            {data.map((person) => (
              <li key={person.id}>
                <Link
                  to="/people/$id"
                  params={{ id: person.id }}
                  className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-display">
                      {person.full_name}
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      {person.email}
                    </div>
                  </div>
                  <Badge tone="muted">{person.role}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
