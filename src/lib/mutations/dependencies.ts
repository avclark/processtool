import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type DependencyRow =
  Database["public"]["Tables"]["task_template_dependencies"]["Row"];

// Replace-all save (matches v1): delete all dependencies for the template, then
// insert one row per prerequisite with condition_type 'completed'.
export function useSaveDependencies(templateId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.dependencies.byTemplate(templateId);

  return useMutation({
    mutationFn: async (dependsOnIds: string[]) => {
      const { error: delErr } = await supabase
        .from("task_template_dependencies")
        .delete()
        .eq("task_template_id", templateId);
      if (delErr) throw delErr;

      if (dependsOnIds.length > 0) {
        const rows = dependsOnIds.map((id) => ({
          task_template_id: templateId,
          depends_on_task_template_id: id,
          condition_type: "completed",
        }));
        const { error: insErr } = await supabase
          .from("task_template_dependencies")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onMutate: async (dependsOnIds) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DependencyRow[]>(key);
      const optimistic: DependencyRow[] = dependsOnIds.map((id, i) => ({
        id: `temp-${i}`,
        task_template_id: templateId,
        depends_on_task_template_id: id,
        condition_type: "completed",
      }));
      qc.setQueryData<DependencyRow[]>(key, optimistic);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      qc.setQueryData(key, ctx?.previous);
      error("Couldn't save dependencies", "Please try again.");
    },
    onSuccess: () => success("Dependencies saved"),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
