import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteShow } from "@/lib/mutations/shows";
import { useEpisodeCountByShow } from "@/lib/queries/episodes";

interface DeleteShowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  show: { id: string; name: string };
  // Called after a successful delete (e.g. to navigate away from the detail page).
  onDeleted?: () => void;
}

export function DeleteShowDialog({
  open,
  onOpenChange,
  show,
  onDeleted,
}: DeleteShowDialogProps) {
  const deleteShow = useDeleteShow();
  // Pre-check episodes only while the dialog is open. This caches the count,
  // which useDeleteShow also reads to avoid optimistically removing a show it
  // can't actually delete (the mutationFn keeps the authoritative guard).
  const episodeCount = useEpisodeCountByShow(show.id, open);

  const count = episodeCount.data ?? 0;
  const blocked = !episodeCount.isLoading && !episodeCount.error && count > 0;

  async function handleDelete() {
    try {
      await deleteShow.mutateAsync({ id: show.id });
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // Error toast already shown (e.g. the episode guard). Keep dialog open.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete show?</DialogTitle>
          {blocked ? (
            <DialogDescription>
              Can't delete <strong>{show.name}</strong> — this show has {count}{" "}
              episode{count > 1 ? "s" : ""}. Remove{" "}
              {count > 1 ? "them" : "it"} first.
            </DialogDescription>
          ) : (
            <DialogDescription>
              This permanently deletes <strong>{show.name}</strong> and its
              settings and role assignments. This action cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteShow.isPending}
          >
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deleteShow.isPending || episodeCount.isLoading}
            >
              {deleteShow.isPending
                ? "Deleting…"
                : episodeCount.isLoading
                  ? "Checking…"
                  : "Delete show"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
