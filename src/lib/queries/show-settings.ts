import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Global setting definitions (the questions/attributes every show answers).
// Drives conditional task generation in Phase 7, so the shape matters.
export const settingDefinitionsQueryOptions = queryOptions({
  queryKey: queryKeys.settingDefinitions.list(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("show_setting_definitions")
      .select("*")
      .order("display_order");
    if (error) throw error;
    return data;
  },
});

// A single show's answers. One row per (show, definition) — see the UNIQUE
// constraint; values are upserted on save (never seeded on show create).
export function showSettingValuesQueryOptions(showId: string) {
  return queryOptions({
    queryKey: queryKeys.showSettingValues.byShow(showId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("show_setting_values")
        .select("*")
        .eq("show_id", showId);
      if (error) throw error;
      return data;
    },
  });
}

export function useSettingDefinitions() {
  return useQuery(settingDefinitionsQueryOptions);
}

export function useShowSettingValues(showId: string) {
  return useQuery(showSettingValuesQueryOptions(showId));
}
