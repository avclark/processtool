import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCompletionActions } from "@/lib/queries/completion-actions";
import { useEmailTemplate } from "@/lib/queries/email-template";
import { useSettingDefinitions } from "@/lib/queries/show-settings";
import { useTaskTemplateBlocks } from "@/lib/queries/task-template-blocks";
import {
  useSaveActions,
  type EmailTemplateInput,
} from "@/lib/mutations/actions";

const ACTION_TYPES: { value: string; label: string }[] = [
  { value: "send_notification", label: "Send in-app notification" },
  { value: "send_email", label: "Send email" },
  { value: "add_tag", label: "Add tag" },
  { value: "remove_tag", label: "Remove tag" },
  { value: "send_webhook", label: "Send webhook" },
];

function actionLabel(type: string): string {
  return ACTION_TYPES.find((a) => a.value === type)?.label ?? type;
}

const EMPTY_EMAIL: EmailTemplateInput = {
  from_name: "",
  subject_template: "",
  body_template: "",
  auto_send_on_complete: false,
};

interface ActionsTabProps {
  templateId: string;
}

export function ActionsTab({ templateId }: ActionsTabProps) {
  const actions = useCompletionActions(templateId);
  const email = useEmailTemplate(templateId);
  const definitions = useSettingDefinitions();
  const blocks = useTaskTemplateBlocks(templateId);
  const save = useSaveActions(templateId);

  const [types, setTypes] = React.useState<string[]>([]);
  const [emailDraft, setEmailDraft] =
    React.useState<EmailTemplateInput>(EMPTY_EMAIL);

  React.useEffect(() => {
    if (actions.data) setTypes(actions.data.map((a) => a.action_type));
  }, [actions.data]);

  React.useEffect(() => {
    if (email.data)
      setEmailDraft({
        from_name: email.data.from_name,
        subject_template: email.data.subject_template,
        body_template: email.data.body_template,
        auto_send_on_complete: email.data.auto_send_on_complete,
      });
  }, [email.data]);

  const hasSendEmail = types.includes("send_email");
  const available = ACTION_TYPES.filter((a) => !types.includes(a.value));

  const tokens = React.useMemo(() => {
    const list = ["{{episode.title}}", "{{show.name}}"];
    for (const d of definitions.data ?? [])
      list.push(`{{show.setting.${d.label}}}`);
    for (const b of blocks.data ?? [])
      if (b.token_name) list.push(`{{${b.token_name}}}`);
    return list;
  }, [definitions.data, blocks.data]);

  function handleSave() {
    save.mutate({
      actions: types,
      email: hasSendEmail ? emailDraft : null,
    });
  }

  if (actions.isLoading || email.isLoading)
    return <p className="text-sm text-ink-muted">Loading…</p>;
  if (actions.error || email.error)
    return (
      <div className="callout callout-danger">
        <p>Failed to load actions.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Actions run when this task is completed. Sending is wired up in Phase 12;
        here you configure what should happen.
      </p>

      {types.length === 0 ? (
        <p className="text-sm text-ink-muted">No actions configured.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <span key={type} className="inline-flex items-center gap-1">
              <Badge tone="muted">{actionLabel(type)}</Badge>
              <button
                type="button"
                aria-label={`Remove ${actionLabel(type)}`}
                onClick={() =>
                  setTypes((prev) => prev.filter((t) => t !== type))
                }
                className="cursor-pointer text-ink-muted hover:text-ink-display"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <Select
          className="sm:max-w-xs"
          value=""
          onChange={(e) => {
            if (e.target.value)
              setTypes((prev) => [...prev, e.target.value]);
          }}
          aria-label="Add action"
        >
          <option value="">Add an action…</option>
          {available.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
      )}

      {hasSendEmail && (
        <div className="space-y-4 rounded-md border border-hairline p-4">
          <h4 className="text-sm font-medium text-ink-display">Email template</h4>

          <div className="space-y-2">
            <label htmlFor="email-from">From name</label>
            <Input
              id="email-from"
              value={emailDraft.from_name}
              onChange={(e) =>
                setEmailDraft((d) => ({ ...d, from_name: e.target.value }))
              }
              placeholder="Production Team"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email-subject">Subject</label>
            <Input
              id="email-subject"
              value={emailDraft.subject_template}
              onChange={(e) =>
                setEmailDraft((d) => ({
                  ...d,
                  subject_template: e.target.value,
                }))
              }
              placeholder="New episode: {{episode.title}}"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email-body">Body</label>
            <textarea
              id="email-body"
              className="form-control form-control-textarea"
              rows={6}
              value={emailDraft.body_template}
              onChange={(e) =>
                setEmailDraft((d) => ({
                  ...d,
                  body_template: e.target.value,
                }))
              }
              placeholder="Write the email body. Use tokens like {{show.name}}."
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-normal text-ink-body">
            <Checkbox
              checked={emailDraft.auto_send_on_complete}
              onChange={(e) =>
                setEmailDraft((d) => ({
                  ...d,
                  auto_send_on_complete: e.target.checked,
                }))
              }
            />
            Automatically send when the task is completed
          </label>

          <div className="space-y-1">
            <p className="text-xs font-medium text-ink-display">
              Available tokens
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((t) => (
                <code
                  key={t}
                  className="rounded bg-surface px-1.5 py-0.5 text-xs text-ink-body"
                >
                  {t}
                </code>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save actions"}
      </Button>
    </div>
  );
}
