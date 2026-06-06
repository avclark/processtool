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
import { Select } from "@/components/ui/select";
import { useCreateShow, useUpdateShow } from "@/lib/mutations/shows";

interface ShowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // When provided, the dialog edits this show; otherwise it creates a new one.
  show?: { id: string; name: string; status: string };
}

export function ShowFormDialog({
  open,
  onOpenChange,
  show,
}: ShowFormDialogProps) {
  const isEdit = !!show;
  const createShow = useCreateShow();
  const updateShow = useUpdateShow();

  const [name, setName] = React.useState("");
  const [status, setStatus] = React.useState("active");
  const [nameError, setNameError] = React.useState<string | null>(null);

  // Seed the form whenever the dialog opens (so edit shows current values and
  // create starts blank). No auto-save — values commit only on Save.
  React.useEffect(() => {
    if (open) {
      setName(show?.name ?? "");
      setStatus(show?.status ?? "active");
      setNameError(null);
    }
  }, [open, show]);

  const pending = createShow.isPending || updateShow.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    try {
      if (isEdit) {
        await updateShow.mutateAsync({ id: show.id, name: trimmed, status });
      } else {
        await createShow.mutateAsync({ name: trimmed, status });
      }
      onOpenChange(false);
    } catch {
      // The mutation already surfaced an error toast and rolled back the cache.
      // Keep the dialog open so the user's input is preserved.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit show" : "New show"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this show's details."
              : "Create a show. You can fill in its settings afterward."}
          </DialogDescription>
        </DialogHeader>

        <form id="show-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="show-name">Name</label>
            <Input
              id="show-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. The Marketing Podcast"
              aria-invalid={!!nameError}
              autoFocus
            />
            {nameError && (
              <p className="text-xs text-danger-display">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="show-status">Status</label>
            <Select
              id="show-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
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
          <Button type="submit" form="show-form" disabled={pending}>
            {pending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save"
                : "Create show"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
