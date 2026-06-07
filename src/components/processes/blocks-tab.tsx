import * as React from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTaskTemplateBlocks } from "@/lib/queries/task-template-blocks";
import { useSaveBlocks } from "@/lib/mutations/task-template-blocks";
import {
  BlockSettingsDialog,
  BLOCK_TYPES,
  NEEDS_OPTIONS,
  blockTypeLabel,
  type DraftBlock,
} from "@/components/processes/block-settings-dialog";

interface BlocksTabProps {
  templateId: string;
}

export function BlocksTab({ templateId }: BlocksTabProps) {
  const { data, isLoading, error } = useTaskTemplateBlocks(templateId);
  const save = useSaveBlocks(templateId);

  const [draft, setDraft] = React.useState<DraftBlock[]>([]);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Re-seed the draft from the saved blocks whenever they load/change.
  React.useEffect(() => {
    if (data) setDraft(data.map(toDraft));
  }, [data]);

  function addBlock(type: string) {
    if (!type) return;
    const block: DraftBlock = {
      key: crypto.randomUUID(),
      block_type: type,
      label: "",
      required: false,
      options_json: NEEDS_OPTIONS.has(type) ? [] : null,
      token_name: null,
    };
    setDraft((prev) => [...prev, block]);
    // Open settings immediately so the new block can be configured.
    setEditingKey(block.key);
    setDialogOpen(true);
  }

  function applyEdit(updated: DraftBlock) {
    setDraft((prev) => prev.map((b) => (b.key === updated.key ? updated : b)));
  }

  function removeBlock(key: string) {
    setDraft((prev) => prev.filter((b) => b.key !== key));
  }

  function handleSave() {
    save.mutate(
      draft.map((b) => ({
        block_type: b.block_type,
        label: b.label,
        required: b.required,
        options_json: b.options_json,
        token_name: b.token_name,
      })),
    );
  }

  const editingBlock = draft.find((b) => b.key === editingKey) ?? null;

  if (isLoading)
    return <p className="text-sm text-ink-muted">Loading blocks…</p>;
  if (error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load blocks.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {draft.length === 0 ? (
        <p className="text-sm text-ink-muted">No blocks yet. Add one below.</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
          {draft.map((block) => (
            <li
              key={block.key}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <Badge tone="muted">{blockTypeLabel(block.block_type)}</Badge>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-display">
                {block.label || (
                  <span className="text-ink-muted italic">(no label)</span>
                )}
              </span>
              {block.required && <Badge tone="signal">Required</Badge>}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Block settings"
                onClick={() => {
                  setEditingKey(block.key);
                  setDialogOpen(true);
                }}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeBlock(block.key)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select
          className="sm:max-w-xs"
          value=""
          onChange={(e) => addBlock(e.target.value)}
          aria-label="Add block"
        >
          <option value="">Add block…</option>
          {BLOCK_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {bt.label}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save blocks"}
        </Button>
      </div>

      <BlockSettingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        block={editingBlock}
        onSave={applyEdit}
      />
    </div>
  );
}

function toDraft(b: {
  id: string;
  block_type: string;
  label: string;
  required: boolean;
  options_json: unknown;
  token_name: string | null;
}): DraftBlock {
  return {
    key: b.id,
    block_type: b.block_type,
    label: b.label,
    required: b.required,
    options_json: Array.isArray(b.options_json)
      ? (b.options_json as string[])
      : null,
    token_name: b.token_name,
  };
}
