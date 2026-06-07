import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Visibility rules for a task template (the match mode itself lives on
// task_templates.visibility_logic, not here).
export function visibilityRulesQueryOptions(templateId: string) {
  return queryOptions({
    queryKey: queryKeys.visibilityRules.byTemplate(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_template_visibility_rules")
        .select("*")
        .eq("task_template_id", templateId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useVisibilityRules(templateId: string) {
  return useQuery(visibilityRulesQueryOptions(templateId));
}
