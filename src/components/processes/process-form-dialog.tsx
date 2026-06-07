import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateProcess, useRenameProcess } from "@/lib/mutations/processes";

interface ProcessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // When provided, the dialog renames this process; otherwise it creates one.
  process?: { id: string; name: string };
}

export function ProcessFormDialog({
  open,
  onOpenChange,
  process,
}: ProcessFormDialogProps) {
  const isEdit = !!process;
  const createProcess = useCreateProcess();
  const renameProcess = useRenameProcess();

  const [name, setName] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(process?.name ?? "");
      setNameError(null);
    }
  }, [open, process]);

  const pending = createProcess.isPending || renameProcess.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    try {
      if (isEdit) {
        await renameProcess.mutateAsync({ id: process.id, name: trimmed });
      } else {
        await createProcess.mutateAsync({ name: trimmed });
      }
      onOpenChange(false);
    } catch {
      // Error toast already shown; keep dialog open with input intact.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Rename process" : "New process"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this process's name."
              : "Create a reusable process. Add task templates after creating it."}
          </DialogDescription>
        </DialogHeader>

        <form id="process-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="process-name">Name</label>
            <Input
              id="process-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Weekly Episode Production"
              aria-invalid={!!nameError}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-danger-display">{nameError}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" form="process-form" disabled={pending}>
            {pending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save"
                : "Create process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
