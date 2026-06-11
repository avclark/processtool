import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteEpisode } from "@/lib/mutations/episodes";

interface DeleteEpisodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episode: { id: string; title: string };
  taskCount: number;
  onDeleted?: () => void;
}

export function DeleteEpisodeDialog({
  open,
  onOpenChange,
  episode,
  taskCount,
  onDeleted,
}: DeleteEpisodeDialogProps) {
  const deleteEpisode = useDeleteEpisode();

  async function handleDelete() {
    try {
      await deleteEpisode.mutateAsync({ id: episode.id });
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // Error toast already shown; keep dialog open.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete episode?</DialogTitle>
          <DialogDescription>
            This permanently deletes <strong>{episode.title}</strong> and its{" "}
            {taskCount} generated task{taskCount === 1 ? "" : "s"} (the whole task
            list cascades). This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteEpisode.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={deleteEpisode.isPending}
          >
            {deleteEpisode.isPending ? "Deleting…" : "Delete episode"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
