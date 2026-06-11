import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { useShows } from "@/lib/queries/shows";
import { useCreateEpisode } from "@/lib/mutations/episodes";

interface CreateEpisodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  // The workflow's assigned process — required (the trigger is gated on it).
  processId: string;
}

export function CreateEpisodeDialog({
  open,
  onOpenChange,
  workflowId,
  processId,
}: CreateEpisodeDialogProps) {
  const navigate = useNavigate();
  const shows = useShows();
  const createEpisode = useCreateEpisode(workflowId);

  const [title, setTitle] = React.useState("");
  const [showId, setShowId] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setShowId("");
      setFormError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setFormError("Title is required.");
      return;
    }
    if (!showId) {
      setFormError("Select a show.");
      return;
    }
    try {
      const { episodeId } = await createEpisode.mutateAsync({
        processId,
        showId,
        title: trimmed,
      });
      onOpenChange(false);
      navigate({ to: "/episodes/$id", params: { id: episodeId } });
    } catch {
      // Error toast shown by the mutation; keep the dialog open with input.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New episode</DialogTitle>
          <DialogDescription>
            Generates the task list from this workflow's process for the chosen
            show.
          </DialogDescription>
        </DialogHeader>

        <form id="episode-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="episode-title">Title</label>
            <Input
              id="episode-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Episode 42"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="episode-show">Show</label>
            <Select
              id="episode-show"
              value={showId}
              onChange={(e) => {
                setShowId(e.target.value);
                if (formError) setFormError(null);
              }}
            >
              <option value="">Select a show…</option>
              {(shows.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {formError && (
            <p className="text-xs text-danger-display">{formError}</p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={createEpisode.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="episode-form"
            disabled={createEpisode.isPending}
          >
            {createEpisode.isPending ? "Generating…" : "Create episode"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
