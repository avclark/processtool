import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export const workflowsQueryOptions = queryOptions({
  queryKey: queryKeys.workflows.list(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("workflows")
      .select("id, name, item_label, process_id, created_at, processes(name)")
      .order("name");
    if (error) throw error;
    return data;
  },
});

export function workflowQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.workflows.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("*, processes(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkflows() {
  return useQuery(workflowsQueryOptions);
}

export function useWorkflow(id: string) {
  return useQuery(workflowQueryOptions(id));
}
