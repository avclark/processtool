import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { showQueryOptions, useShow } from "@/lib/queries/shows";
import {
  useSettingDefinitions,
  useShowSettingValues,
} from "@/lib/queries/show-settings";
import {
  useRoles,
  useRoleMembers,
  useShowRoleAssignments,
} from "@/lib/queries/roles";
import { usePeople } from "@/lib/queries/people";
import { DataTable, DataRow } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShowFormDialog } from "@/components/shows/show-form-dialog";
import { DeleteShowDialog } from "@/components/shows/delete-show-dialog";
import { ShowSettingsForm } from "@/components/shows/show-settings-form";
import { ShowRolesForm } from "@/components/shows/show-roles-form";

export const Route = createFileRoute("/_shell/shows/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(showQueryOptions(params.id)),
  component: ShowDetailPage,
});

function ShowDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useShow(id);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1>{data.name}</h1>
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
        </section>

        <section>
          <h2 className="mb-1">Settings</h2>
          <p className="mb-4 text-sm text-ink-muted">
            These attribute answers drive conditional task generation.
          </p>
          <SettingsSection showId={id} />
        </section>

        <section>
          <h2 className="mb-1">Role assignments</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Assign a person to each production role for this show.
          </p>
          <RolesSection showId={id} />
        </section>
      </div>

      <ShowFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        show={{ id: data.id, name: data.name, status: data.status }}
      />
      <DeleteShowDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        show={{ id: data.id, name: data.name }}
        onDeleted={() => navigate({ to: "/shows" })}
      />
    </>
  );
}

function SettingsSection({ showId }: { showId: string }) {
  const definitions = useSettingDefinitions();
  const values = useShowSettingValues(showId);

  if (definitions.isLoading || values.isLoading)
    return <p className="text-sm text-ink-muted">Loading settings…</p>;
  if (definitions.error || values.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load settings.</p>
      </div>
    );

  return (
    <ShowSettingsForm
      showId={showId}
      definitions={definitions.data ?? []}
      values={values.data ?? []}
    />
  );
}

function RolesSection({ showId }: { showId: string }) {
  const roles = useRoles();
  const roleMembers = useRoleMembers();
  const people = usePeople();
  const assignments = useShowRoleAssignments(showId);

  if (
    roles.isLoading ||
    roleMembers.isLoading ||
    people.isLoading ||
    assignments.isLoading
  )
    return <p className="text-sm text-ink-muted">Loading roles…</p>;
  if (roles.error || roleMembers.error || people.error || assignments.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load role assignments.</p>
      </div>
    );

  return (
    <ShowRolesForm
      showId={showId}
      roles={roles.data ?? []}
      roleMembers={roleMembers.data ?? []}
      people={people.data ?? []}
      assignments={assignments.data ?? []}
    />
  );
}
