import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type RuleRow = Database["public"]["Tables"]["task_template_visibility_rules"]["Row"];
type TaskTemplateRow = Database["public"]["Tables"]["task_templates"]["Row"];

export interface VisibilityRuleInput {
  name: string;
  setting_definition_id: string;
  operator: string;
  target_value: string | null;
  is_active: boolean;
}

// Replace-all save (matches v1): update the template's match mode
// (visibility_logic), delete all rules, re-insert. The match mode lives on
// task_templates, the rules in their own table.
export function useSaveVisibilityRules(processId: string, templateId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const rulesKey = queryKeys.visibilityRules.byTemplate(templateId);
  const listKey = queryKeys.taskTemplates.byProcess(processId);

  return useMutation({
    mutationFn: async (input: {
      logic: "and" | "or";
      rules: VisibilityRuleInput[];
    }) => {
      const { error: logicErr } = await supabase
        .from("task_templates")
        .update({ visibility_logic: input.logic })
        .eq("id", templateId);
      if (logicErr) throw logicErr;

      const { error: delErr } = await supabase
        .from("task_template_visibility_rules")
        .delete()
        .eq("task_template_id", templateId);
      if (delErr) throw delErr;

      if (input.rules.length > 0) {
        const rows = input.rules.map((r) => ({
          task_template_id: templateId,
          name: r.name,
          setting_definition_id: r.setting_definition_id,
          operator: r.operator,
          target_value: r.target_value,
          is_active: r.is_active,
        }));
        const { error: insErr } = await supabase
          .from("task_template_visibility_rules")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: rulesKey });
      await qc.cancelQueries({ queryKey: listKey });
      const prevRules = qc.getQueryData<RuleRow[]>(rulesKey);
      const prevList = qc.getQueryData<TaskTemplateRow[]>(listKey);

      const optimistic: RuleRow[] = input.rules.map((r, i) => ({
        id: `temp-${i}`,
        task_template_id: templateId,
        name: r.name,
        setting_definition_id: r.setting_definition_id,
        operator: r.operator,
        target_value: r.target_value,
        is_active: r.is_active,
        created_at: new Date().toISOString(),
      }));
      qc.setQueryData<RuleRow[]>(rulesKey, optimistic);
      qc.setQueryData<TaskTemplateRow[]>(listKey, (old) =>
        old?.map((t) =>
          t.id === templateId ? { ...t, visibility_logic: input.logic } : t,
        ),
      );
      return { prevRules, prevList };
    },
    onError: (_err, _input, ctx) => {
      qc.setQueryData(rulesKey, ctx?.prevRules);
      if (ctx?.prevList) qc.setQueryData(listKey, ctx.prevList);
      error("Couldn't save visibility rules", "Please try again.");
    },
    onSuccess: () => success("Visibility rules saved"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: rulesKey });
      qc.invalidateQueries({ queryKey: listKey });
    },
  });
}
