import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { personQueryOptions, usePerson } from "@/lib/queries/people";
import { useRoles, useRoleMembers } from "@/lib/queries/roles";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonFormDialog } from "@/components/people/person-form-dialog";
import { DeletePersonDialog } from "@/components/people/delete-person-dialog";

export const Route = createFileRoute("/_shell/people/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(personQueryOptions(params.id)),
  component: PersonDetailPage,
});

function PersonDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = usePerson(id);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1>{data.full_name}</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-10">
        <section>
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
        </section>

        <section>
          <h2 className="mb-1">Production roles</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Roles this person is in the pool for. Manage pools from the People
            page.
          </p>
          <RoleMemberships userId={id} />
        </section>
      </div>

      <PersonFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        person={{
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          timezone: data.timezone,
          role: data.role,
        }}
      />
      <DeletePersonDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        person={{ id: data.id, full_name: data.full_name }}
        onDeleted={() => navigate({ to: "/people" })}
      />
    </>
  );
}

function RoleMemberships({ userId }: { userId: string }) {
  const roles = useRoles();
  const roleMembers = useRoleMembers();

  if (roles.isLoading || roleMembers.isLoading)
    return <p className="text-sm text-ink-muted">Loading roles…</p>;
  if (roles.error || roleMembers.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load roles.</p>
      </div>
    );

  const roleIds = new Set(
    (roleMembers.data ?? [])
      .filter((rm) => rm.user_id === userId)
      .map((rm) => rm.role_id),
  );
  const memberRoles = (roles.data ?? []).filter((r) => roleIds.has(r.id));

  if (memberRoles.length === 0)
    return (
      <p className="text-sm text-ink-muted">
        Not in any role pools yet.
      </p>
    );

  return (
    <div className="flex flex-wrap gap-2">
      {memberRoles.map((r) => (
        <Badge key={r.id} tone="accent">
          {r.name}
        </Badge>
      ))}
    </div>
  );
}
