import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteProcess } from "@/lib/mutations/processes";
import { useWorkflowCountByProcess } from "@/lib/queries/workflows";
import { useEpisodeCountByProcess } from "@/lib/queries/episodes";

interface DeleteProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  process: { id: string; name: string };
  onDeleted?: () => void;
}

export function DeleteProcessDialog({
  open,
  onOpenChange,
  process,
  onDeleted,
}: DeleteProcessDialogProps) {
  const deleteProcess = useDeleteProcess();
  // Pre-check references only while open. Caches both counts so useDeleteProcess
  // can gate its optimistic removal.
  const workflowCount = useWorkflowCountByProcess(process.id, open);
  const episodeCount = useEpisodeCountByProcess(process.id, open);

  const loading = workflowCount.isLoading || episodeCount.isLoading;
  const errored = !!workflowCount.error || !!episodeCount.error;
  const wf = workflowCount.data ?? 0;
  const ep = episodeCount.data ?? 0;
  const blocked = !loading && !errored && (wf > 0 || ep > 0);

  const refParts: string[] = [];
  if (wf > 0) refParts.push(`${wf} workflow${wf > 1 ? "s" : ""}`);
  if (ep > 0) refParts.push(`${ep} episode${ep > 1 ? "s" : ""}`);

  async function handleDelete() {
    try {
      await deleteProcess.mutateAsync({ id: process.id });
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // Error toast already shown (e.g. the reference guard). Keep dialog open.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete process?</DialogTitle>
          {blocked ? (
            <DialogDescription>
              Can't delete <strong>{process.name}</strong> — it's used by{" "}
              {refParts.join(" and ")}. Remove those references first.
            </DialogDescription>
          ) : (
            <DialogDescription>
              This permanently deletes <strong>{process.name}</strong> and all of
              its task templates (blocks, rules, dependencies, dates, and
              actions). This action cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleteProcess.isPending}
          >
            {blocked ? "Close" : "Cancel"}
          </Button>
          {!blocked && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={deleteProcess.isPending || loading}
            >
              {deleteProcess.isPending
                ? "Deleting…"
                : loading
                  ? "Checking…"
                  : "Delete process"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
