import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type DateRuleRow =
  Database["public"]["Tables"]["task_template_date_rules"]["Row"];

export interface DateRuleInput {
  date_field: "start_date" | "due_date";
  relative_to: "task_start" | "task_due" | "episode_start";
  relative_task_template_id: string | null;
  offset_days: number;
  offset_hours: number;
}

// Replace-all save (matches v1): delete all date rules for the template, then
// insert the current set (at most one per date_field).
export function useSaveDateRules(templateId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.dateRules.byTemplate(templateId);

  return useMutation({
    mutationFn: async (rules: DateRuleInput[]) => {
      const { error: delErr } = await supabase
        .from("task_template_date_rules")
        .delete()
        .eq("task_template_id", templateId);
      if (delErr) throw delErr;

      if (rules.length > 0) {
        const rows = rules.map((r) => ({
          task_template_id: templateId,
          date_field: r.date_field,
          relative_to: r.relative_to,
          // episode_start rules carry no reference task.
          relative_task_template_id:
            r.relative_to === "episode_start"
              ? null
              : r.relative_task_template_id,
          offset_days: r.offset_days,
          offset_hours: r.offset_hours,
        }));
        const { error: insErr } = await supabase
          .from("task_template_date_rules")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onMutate: async (rules) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DateRuleRow[]>(key);
      const optimistic: DateRuleRow[] = rules.map((r, i) => ({
        id: `temp-${i}`,
        task_template_id: templateId,
        date_field: r.date_field,
        relative_to: r.relative_to,
        relative_task_template_id:
          r.relative_to === "episode_start"
            ? null
            : r.relative_task_template_id,
        offset_days: r.offset_days,
        offset_hours: r.offset_hours,
      }));
      qc.setQueryData<DateRuleRow[]>(key, optimistic);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      qc.setQueryData(key, ctx?.previous);
      error("Couldn't save date rules", "Please try again.");
    },
    onSuccess: () => success("Date rules saved"),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
