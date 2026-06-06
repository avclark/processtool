import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database, Json } from "@/lib/database.types";

type SettingValueRow =
  Database["public"]["Tables"]["show_setting_values"]["Row"];

export interface SettingValueInput {
  setting_definition_id: string;
  value_json: Json | null;
}

// Saves a show's answers. Matches v1: one upsert keyed on the
// (show_id, setting_definition_id) unique constraint, so re-saving overwrites
// in place rather than creating duplicates.
export function useSaveShowSettings(showId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (payload: SettingValueInput[]) => {
      const rows = payload.map((p) => ({
        show_id: showId,
        setting_definition_id: p.setting_definition_id,
        value_json: p.value_json,
        updated_at: new Date().toISOString(),
      }));
      const { error: err } = await supabase
        .from("show_setting_values")
        .upsert(rows, { onConflict: "show_id,setting_definition_id" });
      if (err) throw err;
    },
    onMutate: async (payload) => {
      const key = queryKeys.showSettingValues.byShow(showId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SettingValueRow[]>(key);
      const optimistic: SettingValueRow[] = payload.map((p) => {
        const existing = previous?.find(
          (v) => v.setting_definition_id === p.setting_definition_id,
        );
        return {
          id: existing?.id ?? `temp-${p.setting_definition_id}`,
          show_id: showId,
          setting_definition_id: p.setting_definition_id,
          value_json: p.value_json,
          updated_at: new Date().toISOString(),
        };
      });
      qc.setQueryData<SettingValueRow[]>(key, optimistic);
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
      qc.setQueryData(
        queryKeys.showSettingValues.byShow(showId),
        ctx?.previous,
      );
      error("Couldn't save settings", "Please try again.");
    },
    onSuccess: () => success("Settings saved"),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.showSettingValues.byShow(showId),
      }),
  });
}
