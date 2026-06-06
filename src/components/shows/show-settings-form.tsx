import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextField } from "@/components/ui/rich-text-field";
import {
  useSaveShowSettings,
  type SettingValueInput,
} from "@/lib/mutations/show-settings";
import type { Database, Json } from "@/lib/database.types";

type Definition =
  Database["public"]["Tables"]["show_setting_definitions"]["Row"];
type Value = Database["public"]["Tables"]["show_setting_values"]["Row"];

const SELECT_NONE = "__none__";

interface ShowSettingsFormProps {
  showId: string;
  definitions: Definition[];
  values: Value[];
}

export function ShowSettingsForm({
  showId,
  definitions,
  values,
}: ShowSettingsFormProps) {
  const save = useSaveShowSettings(showId);

  const [draft, setDraft] = React.useState<Record<string, Json | null>>(() =>
    buildDraft(definitions, values),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Re-seed when the underlying data changes (e.g. after a refetch).
  React.useEffect(() => {
    setDraft(buildDraft(definitions, values));
  }, [definitions, values]);

  function updateValue(defId: string, val: Json | null) {
    setDraft((prev) => ({ ...prev, [defId]: val }));
    if (errors[defId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[defId];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate URL/email fields (matches v1).
    const newErrors: Record<string, string> = {};
    for (const def of definitions) {
      const val = draft[def.id];
      if (val === null || val === undefined || val === "") continue;
      if (
        def.field_type === "website_url" &&
        !/^https?:\/\/.+\..+/.test(String(val))
      ) {
        newErrors[def.id] =
          "Please enter a valid URL (e.g. https://example.com)";
      }
      if (
        def.field_type === "email_address" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))
      ) {
        newErrors[def.id] = "Please enter a valid email address";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const payload: SettingValueInput[] = definitions.map((d) => ({
      setting_definition_id: d.id,
      value_json: draft[d.id] ?? null,
    }));
    save.mutate(payload);
  }

  if (definitions.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No show settings have been defined yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {definitions.map((def) => (
        <div key={def.id} className="space-y-2">
          <label>{def.label}</label>
          <SettingInput
            def={def}
            value={draft[def.id]}
            onChange={(val) => updateValue(def.id, val)}
          />
          {errors[def.id] && (
            <p className="text-xs text-danger-display">{errors[def.id]}</p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

function buildDraft(
  definitions: Definition[],
  values: Value[],
): Record<string, Json | null> {
  const valueMap = new Map(
    values.map((v) => [v.setting_definition_id, v.value_json]),
  );
  const draft: Record<string, Json | null> = {};
  for (const d of definitions) draft[d.id] = valueMap.get(d.id) ?? null;
  return draft;
}

function SettingInput({
  def,
  value,
  onChange,
}: {
  def: Definition;
  value: Json | null;
  onChange: (val: Json | null) => void;
}) {
  const options = Array.isArray(def.options_json)
    ? (def.options_json as string[])
    : [];

  switch (def.field_type) {
    case "yes_no":
      return (
        <RadioGroup orientation="horizontal">
          <label className="flex items-center gap-2 text-sm font-normal text-ink-body">
            <Radio
              name={`setting-${def.id}`}
              checked={value === true}
              onChange={() => onChange(true)}
            />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm font-normal text-ink-body">
            <Radio
              name={`setting-${def.id}`}
              checked={value === false}
              onChange={() => onChange(false)}
            />
            No
          </label>
        </RadioGroup>
      );

    case "text":
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Enter value"
        />
      );

    case "textarea":
      return (
        <textarea
          className="form-control form-control-textarea"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Enter value"
        />
      );

    case "rich_text":
      return (
        <RichTextField
          defaultValue={(value as string) ?? ""}
          onChange={(markdown) => onChange(markdown || null)}
          placeholder="Enter rich text…"
        />
      );

    case "checklist":
      return (
        <ChecklistInput
          value={Array.isArray(value) ? (value as string[]) : null}
          onChange={onChange}
        />
      );

    case "select_dropdown":
      return (
        <Select
          value={(value as string) ?? SELECT_NONE}
          onChange={(e) =>
            onChange(e.target.value === SELECT_NONE ? null : e.target.value)
          }
        >
          <option value={SELECT_NONE}>— None —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      );

    case "radio_options":
      return (
        <RadioGroup>
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm font-normal text-ink-body"
            >
              <Radio
                name={`setting-${def.id}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </RadioGroup>
      );

    case "website_url":
      return (
        <Input
          type="url"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://example.com"
        />
      );

    case "email_address":
      return (
        <Input
          type="email"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="name@example.com"
        />
      );

    case "file_upload":
      return (
        <div className="space-y-1">
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="File URL"
          />
          <p className="text-xs text-ink-muted">
            File upload arrives in Phase 10; for now this stores a URL.
          </p>
        </div>
      );

    default:
      return null;
  }
}

function ChecklistInput({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (val: Json | null) => void;
}) {
  const items = Array.isArray(value) ? value : [];
  const [newItem, setNewItem] = React.useState("");

  function addItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setNewItem("");
  }

  function removeItem(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : null);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Checkbox checked disabled />
          <span className="flex-1 text-sm text-ink-body">{item}</span>
          <button
            type="button"
            onClick={() => removeItem(i)}
            aria-label={`Remove ${item}`}
            className="cursor-pointer text-ink-muted hover:text-ink-display"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" size="icon" variant="secondary" onClick={addItem}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
