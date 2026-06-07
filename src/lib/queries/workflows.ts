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

// Count of workflows referencing a process. Gates process deletion (v1 blocks
// deleting a process any workflow uses; the FK is ON DELETE SET NULL).
export function workflowCountByProcessQueryOptions(processId: string) {
  return queryOptions({
    queryKey: queryKeys.workflows.countByProcess(processId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("workflows")
        .select("id", { count: "exact", head: true })
        .eq("process_id", processId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useWorkflows() {
  return useQuery(workflowsQueryOptions);
}

export function useWorkflowCountByProcess(processId: string, enabled = true) {
  return useQuery({
    ...workflowCountByProcessQueryOptions(processId),
    enabled,
  });
}

export function useWorkflow(id: string) {
  return useQuery(workflowQueryOptions(id));
}
