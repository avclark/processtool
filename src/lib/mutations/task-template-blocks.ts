import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database, Json } from "@/lib/database.types";

type BlockRow = Database["public"]["Tables"]["task_template_blocks"]["Row"];

export interface SaveBlockInput {
  block_type: string;
  label: string;
  required: boolean;
  options_json: Json | null;
  token_name: string | null;
}

// Replace-all save (matches v1): delete every block for the template, then
// re-insert the draft in order. Same shape as the Phase 4 settings/role saves.
export function useSaveBlocks(templateId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.taskTemplateBlocks.byTemplate(templateId);

  return useMutation({
    mutationFn: async (blocks: SaveBlockInput[]) => {
      const { error: delErr } = await supabase
        .from("task_template_blocks")
        .delete()
        .eq("task_template_id", templateId);
      if (delErr) throw delErr;

      if (blocks.length > 0) {
        const rows = blocks.map((b, i) => ({
          task_template_id: templateId,
          block_type: b.block_type,
          label: b.label,
          required: b.required,
          options_json: b.options_json,
          token_name: b.token_name,
          display_order: i,
        }));
        const { error: insErr } = await supabase
          .from("task_template_blocks")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onMutate: async (blocks) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<BlockRow[]>(key);
      const optimistic: BlockRow[] = blocks.map((b, i) => ({
        id: `temp-${i}`,
        task_template_id: templateId,
        block_type: b.block_type,
        label: b.label,
        required: b.required,
        options_json: b.options_json,
        token_name: b.token_name,
        display_order: i,
      }));
      qc.setQueryData<BlockRow[]>(key, optimistic);
      return { previous };
    },
    onError: (_err, _blocks, ctx) => {
      qc.setQueryData(key, ctx?.previous);
      error("Couldn't save blocks", "Please try again.");
    },
    onSuccess: () => success("Blocks saved"),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
