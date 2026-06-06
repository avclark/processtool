import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePeople } from "@/lib/queries/people";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonFormDialog } from "@/components/people/person-form-dialog";
import { RolesManager } from "@/components/people/roles-manager";

export const Route = createFileRoute("/_shell/people/")({
  component: PeoplePage,
});

function PeoplePage() {
  const { data, isLoading, error } = usePeople();
  // "Add Person" creates the record directly. The real invite-email flow
  // (Supabase Auth invite) is deferred to Phase 11.
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>People</h1>
            <p className="mt-1">Team members and their roles.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Add Person</Button>
        </div>
      </div>

      <PersonFormDialog open={createOpen} onOpenChange={setCreateOpen} />

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

      <div className="mt-12 border-t border-hairline pt-8">
        <h2 className="mb-1">Roles</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Production roles and the pool of people who can fill each. Assign these
          to specific shows from a show's detail page.
        </p>
        <RolesManager />
      </div>
    </>
  );
}
