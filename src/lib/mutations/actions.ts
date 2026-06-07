import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type ActionRow =
  Database["public"]["Tables"]["task_template_completion_actions"]["Row"];
type EmailRow =
  Database["public"]["Tables"]["task_template_email_templates"]["Row"];

export interface EmailTemplateInput {
  from_name: string;
  subject_template: string;
  body_template: string;
  auto_send_on_complete: boolean;
}

// Saves the Actions tab in one shot (matches v1's two replace-all actions):
// replace all completion actions, then replace the email template — inserting it
// only when a send_email action is present, otherwise clearing it.
export function useSaveActions(templateId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const actionsKey = queryKeys.completionActions.byTemplate(templateId);
  const emailKey = queryKeys.emailTemplate.byTemplate(templateId);

  return useMutation({
    mutationFn: async (input: {
      actions: string[];
      email: EmailTemplateInput | null;
    }) => {
      const { error: delActErr } = await supabase
        .from("task_template_completion_actions")
        .delete()
        .eq("task_template_id", templateId);
      if (delActErr) throw delActErr;

      if (input.actions.length > 0) {
        const rows = input.actions.map((type) => ({
          task_template_id: templateId,
          action_type: type,
          config_json: null,
        }));
        const { error: insActErr } = await supabase
          .from("task_template_completion_actions")
          .insert(rows);
        if (insActErr) throw insActErr;
      }

      const { error: delEmailErr } = await supabase
        .from("task_template_email_templates")
        .delete()
        .eq("task_template_id", templateId);
      if (delEmailErr) throw delEmailErr;

      if (input.email && input.actions.includes("send_email")) {
        const { error: insEmailErr } = await supabase
          .from("task_template_email_templates")
          .insert({
            task_template_id: templateId,
            from_name: input.email.from_name,
            subject_template: input.email.subject_template,
            body_template: input.email.body_template,
            auto_send_on_complete: input.email.auto_send_on_complete,
          });
        if (insEmailErr) throw insEmailErr;
      }
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: actionsKey });
      await qc.cancelQueries({ queryKey: emailKey });
      const prevActions = qc.getQueryData<ActionRow[]>(actionsKey);
      const prevEmail = qc.getQueryData<EmailRow | null>(emailKey);

      qc.setQueryData<ActionRow[]>(
        actionsKey,
        input.actions.map((type, i) => ({
          id: `temp-${i}`,
          task_template_id: templateId,
          action_type: type,
          config_json: null,
        })),
      );
      const keepEmail = input.email && input.actions.includes("send_email");
      const optimisticEmail: EmailRow | null =
        keepEmail && input.email
          ? {
              id: "temp",
              task_template_id: templateId,
              from_name: input.email.from_name,
              subject_template: input.email.subject_template,
              body_template: input.email.body_template,
              auto_send_on_complete: input.email.auto_send_on_complete,
            }
          : null;
      qc.setQueryData(emailKey, optimisticEmail);
      return { prevActions, prevEmail };
    },
    onError: (_err, _input, ctx) => {
      qc.setQueryData(actionsKey, ctx?.prevActions);
      qc.setQueryData(emailKey, ctx?.prevEmail);
      error("Couldn't save actions", "Please try again.");
    },
    onSuccess: () => success("Actions saved"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: actionsKey });
      qc.invalidateQueries({ queryKey: emailKey });
    },
  });
}
