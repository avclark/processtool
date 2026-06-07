import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// The task templates this template depends on (must be completed first).
export function dependenciesQueryOptions(templateId: string) {
  return queryOptions({
    queryKey: queryKeys.dependencies.byTemplate(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_template_dependencies")
        .select("*")
        .eq("task_template_id", templateId);
      if (error) throw error;
      return data;
    },
  });
}

export function useDependencies(templateId: string) {
  return useQuery(dependenciesQueryOptions(templateId));
}
