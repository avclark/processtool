import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Completion actions for a task template (fire when the task is completed —
// actual sending is Phase 12).
export function completionActionsQueryOptions(templateId: string) {
  return queryOptions({
    queryKey: queryKeys.completionActions.byTemplate(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_template_completion_actions")
        .select("*")
        .eq("task_template_id", templateId);
      if (error) throw error;
      return data;
    },
  });
}

export function useCompletionActions(templateId: string) {
  return useQuery(completionActionsQueryOptions(templateId));
}
