import * as React from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export interface DraftBlock {
  key: string;
  block_type: string;
  label: string;
  required: boolean;
  options_json: string[] | null;
  token_name: string | null;
}

export const BLOCK_TYPES: { value: string; label: string }[] = [
  { value: "heading", label: "Heading" },
  { value: "description", label: "Description" },
  { value: "text_input", label: "Text input" },
  { value: "rich_text", label: "Rich text" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date_time", label: "Date & time" },
  { value: "file_attachment", label: "File attachment" },
  { value: "comments", label: "Comments" },
];

export const NEEDS_OPTIONS = new Set(["dropdown", "radio", "checkbox"]);
// Display/special blocks have no "required" flag or email token.
const NON_FIELD = new Set(["heading", "description", "comments"]);

export function blockTypeLabel(type: string): string {
  return BLOCK_TYPES.find((b) => b.value === type)?.label ?? type;
}

interface BlockSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: DraftBlock | null;
  onSave: (updated: DraftBlock) => void;
}

export function BlockSettingsDialog({
  open,
  onOpenChange,
  block,
  onSave,
}: BlockSettingsDialogProps) {
  const [label, setLabel] = React.useState("");
  const [required, setRequired] = React.useState(false);
  const [tokenName, setTokenName] = React.useState("");
  const [options, setOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open && block) {
      setLabel(block.label);
      setRequired(block.required);
      setTokenName(block.token_name ?? "");
      setOptions(block.options_json ?? []);
    }
  }, [open, block]);

  if (!block) return null;

  const isField = !NON_FIELD.has(block.block_type);
  const needsOptions = NEEDS_OPTIONS.has(block.block_type);
  const labelPlaceholder =
    block.block_type === "heading"
      ? "Heading text"
      : block.block_type === "description"
        ? "Description text"
        : "Label";

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }
  function removeOption(i: number) {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    if (!block) return;
    onSave({
      ...block,
      label,
      required: isField ? required : false,
      token_name: isField ? tokenName.trim() || null : null,
      options_json: needsOptions ? options.filter((o) => o.trim()) : null,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{blockTypeLabel(block.block_type)} block</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="block-label">Label</label>
            <Input
              id="block-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={labelPlaceholder}
              autoFocus
            />
          </div>

          {isField && (
            <>
              <label className="flex items-center gap-2 text-sm font-normal text-ink-body">
                <Checkbox
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                Required to complete the task
              </label>

              <div className="space-y-2">
                <label htmlFor="block-token">Token name (optional)</label>
                <Input
                  id="block-token"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. client_notes"
                />
                <p className="text-xs text-ink-muted">
                  Used to reference this field's value in email templates.
                </p>
              </div>
            </>
          )}

          {needsOptions && (
            <div className="space-y-2">
              <label>Options</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove option ${i + 1}`}
                    onClick={() => removeOption(i)}
                    className="cursor-pointer text-ink-muted hover:text-ink-display"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setOptions((prev) => [...prev, ""])}
              >
                <Plus className="h-4 w-4" /> Add option
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
