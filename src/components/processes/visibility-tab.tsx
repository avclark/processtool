import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettingDefinitions } from "@/lib/queries/show-settings";
import { useVisibilityRules } from "@/lib/queries/visibility-rules";
import {
  useSaveVisibilityRules,
  type VisibilityRuleInput,
} from "@/lib/mutations/visibility-rules";
import type { Database } from "@/lib/database.types";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];

const OPERATORS: { value: string; label: string }[] = [
  { value: "must_contain", label: "must contain" },
  { value: "must_not_contain", label: "must not contain" },
  { value: "must_not_be_empty", label: "must not be empty" },
  { value: "must_be_empty", label: "must be empty" },
];

function needsTargetValue(operator: string): boolean {
  return operator === "must_contain" || operator === "must_not_contain";
}

interface DraftRule {
  key: string;
  name: string;
  setting_definition_id: string;
  operator: string;
  target_value: string;
  is_active: boolean;
}

interface VisibilityTabProps {
  processId: string;
  template: TaskTemplate;
}

export function VisibilityTab({ processId, template }: VisibilityTabProps) {
  const definitions = useSettingDefinitions();
  const rules = useVisibilityRules(template.id);
  const save = useSaveVisibilityRules(processId, template.id);

  const [draft, setDraft] = React.useState<DraftRule[]>([]);
  const [logic, setLogic] = React.useState<"and" | "or">(
    (template.visibility_logic as "and" | "or") ?? "and",
  );

  React.useEffect(() => {
    if (rules.data) {
      setDraft(
        rules.data.map((r) => ({
          key: r.id,
          name: r.name,
          setting_definition_id: r.setting_definition_id,
          operator: r.operator,
          target_value: r.target_value ?? "",
          is_active: r.is_active,
        })),
      );
    }
  }, [rules.data]);

  React.useEffect(() => {
    setLogic((template.visibility_logic as "and" | "or") ?? "and");
  }, [template.visibility_logic]);

  const defs = definitions.data ?? [];

  function addRule() {
    setDraft((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        name: "",
        setting_definition_id: defs[0]?.id ?? "",
        operator: "must_contain",
        target_value: "",
        is_active: true,
      },
    ]);
  }

  function updateRule(key: string, patch: Partial<DraftRule>) {
    setDraft((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function removeRule(key: string) {
    setDraft((prev) => prev.filter((r) => r.key !== key));
  }

  function handleSave() {
    const payload: VisibilityRuleInput[] = draft
      .filter((r) => r.setting_definition_id)
      .map((r) => ({
        name: r.name,
        setting_definition_id: r.setting_definition_id,
        operator: r.operator,
        target_value: needsTargetValue(r.operator)
          ? r.target_value || null
          : null,
        is_active: r.is_active,
      }));
    save.mutate({ logic, rules: payload });
  }

  if (definitions.isLoading || rules.isLoading)
    return <p className="text-sm text-ink-muted">Loading…</p>;
  if (definitions.error || rules.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load visibility rules.</p>
      </div>
    );

  if (defs.length === 0)
    return (
      <p className="text-sm text-ink-muted">
        No show settings are defined yet, so there's nothing to key visibility
        off. Add settings under a show first.
      </p>
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        The task is shown only when these rules pass against the episode's show
        settings. No rules means always shown.
      </p>

      {draft.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor={`logic-${template.id}`} className="text-sm">
            Match
          </label>
          <Select
            id={`logic-${template.id}`}
            className="max-w-[10rem]"
            value={logic}
            onChange={(e) => setLogic(e.target.value as "and" | "or")}
          >
            <option value="and">All rules (AND)</option>
            <option value="or">Any rule (OR)</option>
          </Select>
        </div>
      )}

      {draft.map((rule) => (
        <div
          key={rule.key}
          className="space-y-3 rounded-md border border-hairline p-3"
        >
          <div className="flex items-center gap-2">
            <Input
              value={rule.name}
              onChange={(e) => updateRule(rule.key, { name: e.target.value })}
              placeholder="Rule name (optional)"
            />
            <button
              type="button"
              aria-label="Remove rule"
              onClick={() => removeRule(rule.key)}
              className="cursor-pointer text-ink-muted hover:text-ink-display"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select
              value={rule.setting_definition_id}
              onChange={(e) =>
                updateRule(rule.key, { setting_definition_id: e.target.value })
              }
            >
              {defs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
            <Select
              value={rule.operator}
              onChange={(e) =>
                updateRule(rule.key, { operator: e.target.value })
              }
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
            {needsTargetValue(rule.operator) && (
              <Input
                value={rule.target_value}
                onChange={(e) =>
                  updateRule(rule.key, { target_value: e.target.value })
                }
                placeholder="Value"
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm font-normal text-ink-body">
            <Checkbox
              checked={rule.is_active}
              onChange={(e) =>
                updateRule(rule.key, { is_active: e.target.checked })
              }
            />
            Active
          </label>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={addRule}>
          Add rule
        </Button>
        <Button type="button" onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save visibility"}
        </Button>
      </div>
    </div>
  );
}
