import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { processQueryOptions, useProcess } from "@/lib/queries/processes";
import { taskTemplatesByProcessQueryOptions } from "@/lib/queries/task-templates";
import { Button } from "@/components/ui/button";
import { ProcessBuilder } from "@/components/processes/process-builder";
import { ProcessFormDialog } from "@/components/processes/process-form-dialog";
import { DeleteProcessDialog } from "@/components/processes/delete-process-dialog";

export const Route = createFileRoute("/_shell/processes/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(processQueryOptions(params.id)),
      context.queryClient.ensureQueryData(
        taskTemplatesByProcessQueryOptions(params.id),
      ),
    ]),
  component: ProcessDetailPage,
});

function ProcessDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useProcess(id);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading...</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load process.</p>
      </div>
    );
  if (!data)
    return <p className="text-sm text-ink-muted">Process not found.</p>;

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1>{data.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Build the task templates for this process.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Rename
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProcessBuilder processId={id} />
      </div>

      <ProcessFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        process={{ id: data.id, name: data.name }}
      />
      <DeleteProcessDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        process={{ id: data.id, name: data.name }}
        onDeleted={() => navigate({ to: "/processes" })}
      />
    </>
  );
}
