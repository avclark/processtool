import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeletePerson } from "@/lib/mutations/people";
import { useOpenTaskCountByUser } from "@/lib/queries/tasks";

interface DeletePersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: { id: string; full_name: string };
  onDeleted?: () => void;
}

export function DeletePersonDialog({
  open,
  onOpenChange,
  person,
  onDeleted,
}: DeletePersonDialogProps) {
  const deletePerson = useDeletePerson();
  // Pre-check open tasks only while open; caches the count so useDeletePerson
  // can avoid optimistically removing someone it can't delete.
  const openTasks = useOpenTaskCountByUser(person.id, open);

  const count = openTasks.data ?? 0;
  const blocked = !openTasks.isLoading && !openTasks.error && count > 0;

  async function handleDelete() {
    try {
      await deletePerson.mutateAsync({ id: person.id });
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // Error toast already shown (e.g. the open-task guard). Keep dialog open.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete person?</DialogTitle>
          {blocked ? (
            <DialogDescription>
              Can't delete <strong>{person.full_name}</strong> — they have{" "}
              {count} open task{count > 1 ? "s" : ""} assigned. Reassign{" "}
              {count > 1 ? "them" : "it"} first.
            </DialogDescription>
          ) : (
            <DialogDescription>
              This permanently deletes <strong>{person.full_name}</strong> and
              removes them from all role pools and show assignments. This action
              cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deletePerson.isPending}
          >
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deletePerson.isPending || openTasks.isLoading}
            >
              {deletePerson.isPending
                ? "Deleting…"
                : openTasks.isLoading
                  ? "Checking…"
                  : "Delete person"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
