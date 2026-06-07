import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Task templates for a process, in builder order. The dedicated by-process query
// (separate from the process detail) is what create/rename/delete/assignment
// mutations optimistically update.
export function taskTemplatesByProcessQueryOptions(processId: string) {
  return queryOptions({
    queryKey: queryKeys.taskTemplates.byProcess(processId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_templates")
        .select("*")
        .eq("process_id", processId)
        .order("position");
      if (error) throw error;
      return data;
    },
  });
}

export function useTaskTemplates(processId: string) {
  return useQuery(taskTemplatesByProcessQueryOptions(processId));
}
