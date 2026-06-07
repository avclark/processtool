import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export const processesQueryOptions = queryOptions({
  queryKey: queryKeys.processes.list(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("processes")
      .select("id, name, created_at, task_templates(id)")
      .order("name");
    if (error) throw error;
    return data.map((p) => ({
      ...p,
      taskCount: p.task_templates?.length ?? 0,
    }));
  },
});

export function processQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.processes.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useProcesses() {
  return useQuery(processesQueryOptions);
}

export function useProcess(id: string) {
  return useQuery(processQueryOptions(id));
}
