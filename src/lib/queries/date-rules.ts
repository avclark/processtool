import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Date rules for a task template (at most one per date_field — start_date / due_date).
export function dateRulesQueryOptions(templateId: string) {
  return queryOptions({
    queryKey: queryKeys.dateRules.byTemplate(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_template_date_rules")
        .select("*")
        .eq("task_template_id", templateId);
      if (error) throw error;
      return data;
    },
  });
}

export function useDateRules(templateId: string) {
  return useQuery(dateRulesQueryOptions(templateId));
}
