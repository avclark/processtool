import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTaskTemplates } from "@/lib/queries/task-templates";
import { useDateRules } from "@/lib/queries/date-rules";
import {
  useSaveDateRules,
  type DateRuleInput,
} from "@/lib/mutations/date-rules";
import type { Database } from "@/lib/database.types";

type TaskTemplate = Database["public"]["Tables"]["task_templates"]["Row"];
type RelativeTo = "task_start" | "task_due" | "episode_start";

interface DraftDateRule {
  relative_to: RelativeTo;
  relative_task_template_id: string | null;
  offset_days: number;
  offset_hours: number;
}

const ANCHORS: { value: RelativeTo; label: string }[] = [
  { value: "episode_start", label: "Episode creation date" },
  { value: "task_start", label: "Another task's start date" },
  { value: "task_due", label: "Another task's due date" },
];

interface DatesTabProps {
  processId: string;
  template: TaskTemplate;
}

export function DatesTab({ processId, template }: DatesTabProps) {
  const templates = useTaskTemplates(processId);
  const dateRules = useDateRules(template.id);
  const save = useSaveDateRules(template.id);

  const [startRule, setStartRule] = React.useState<DraftDateRule | null>(null);
  const [dueRule, setDueRule] = React.useState<DraftDateRule | null>(null);

  React.useEffect(() => {
    if (!dateRules.data) return;
    const find = (field: string) => {
      const r = dateRules.data.find((x) => x.date_field === field);
      return r
        ? {
            relative_to: r.relative_to as RelativeTo,
            relative_task_template_id: r.relative_task_template_id,
            offset_days: r.offset_days,
            offset_hours: r.offset_hours,
          }
        : null;
    };
    setStartRule(find("start_date"));
    setDueRule(find("due_date"));
  }, [dateRules.data]);

  const others = (templates.data ?? []).filter((t) => t.id !== template.id);

  function handleSave() {
    const rules: DateRuleInput[] = [];
    if (startRule) rules.push({ date_field: "start_date", ...startRule });
    if (dueRule) rules.push({ date_field: "due_date", ...dueRule });
    save.mutate(rules);
  }

  if (templates.isLoading || dateRules.isLoading)
    return <p className="text-sm text-ink-muted">Loading…</p>;
  if (templates.error || dateRules.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load date rules.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <RuleEditor
        title="Start date"
        rule={startRule}
        onChange={setStartRule}
        others={others}
      />
      <RuleEditor
        title="Due date"
        rule={dueRule}
        onChange={setDueRule}
        others={others}
      />
      <Button type="button" onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save date rules"}
      </Button>
    </div>
  );
}

function RuleEditor({
  title,
  rule,
  onChange,
  others,
}: {
  title: string;
  rule: DraftDateRule | null;
  onChange: (rule: DraftDateRule | null) => void;
  others: TaskTemplate[];
}) {
  if (!rule) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-ink-display">{title}</h4>
        <p className="text-sm text-ink-muted">
          No rule — this date is set manually.
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            onChange({
              relative_to: "episode_start",
              relative_task_template_id: null,
              offset_days: 0,
              offset_hours: 0,
            })
          }
        >
          Add {title.toLowerCase()} rule
        </Button>
      </div>
    );
  }

  const isTaskRelative = rule.relative_to !== "episode_start";

  return (
    <div className="space-y-3 rounded-md border border-hairline p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-ink-display">{title}</h4>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(null)}
        >
          Remove
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Select
          value={rule.relative_to}
          onChange={(e) =>
            onChange({
              ...rule,
              relative_to: e.target.value as RelativeTo,
              relative_task_template_id:
                e.target.value === "episode_start"
                  ? null
                  : rule.relative_task_template_id,
            })
          }
        >
          {ANCHORS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>

        {isTaskRelative && (
          <Select
            value={rule.relative_task_template_id ?? ""}
            onChange={(e) =>
              onChange({
                ...rule,
                relative_task_template_id: e.target.value || null,
              })
            }
          >
            <option value="">Select a task…</option>
            {others.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-ink-muted">Offset days</label>
          <Input
            type="number"
            className="w-28"
            value={rule.offset_days}
            onChange={(e) =>
              onChange({ ...rule, offset_days: parseInt(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-ink-muted">Offset hours</label>
          <Input
            type="number"
            className="w-28"
            value={rule.offset_hours}
            onChange={(e) =>
              onChange({ ...rule, offset_hours: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <p className="text-xs text-ink-muted">{previewText(title, rule, others)}</p>
    </div>
  );
}

function previewText(
  title: string,
  rule: DraftDateRule,
  others: TaskTemplate[],
): string {
  const anchor =
    rule.relative_to === "episode_start"
      ? "the episode is created"
      : `${
          others.find((t) => t.id === rule.relative_task_template_id)?.title ??
          "another task"
        }'s ${rule.relative_to === "task_start" ? "start" : "due"} date`;
  return `${title} = ${rule.offset_days} days, ${rule.offset_hours} hours after ${anchor}.`;
}
