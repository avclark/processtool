import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Blocks for a task template, in display order.
export function taskTemplateBlocksQueryOptions(templateId: string) {
  return queryOptions({
    queryKey: queryKeys.taskTemplateBlocks.byTemplate(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_template_blocks")
        .select("*")
        .eq("task_template_id", templateId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useTaskTemplateBlocks(templateId: string) {
  return useQuery(taskTemplateBlocksQueryOptions(templateId));
}
