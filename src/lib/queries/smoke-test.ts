/**
 * TEMPORARY — Phase 2 smoke-test queries.
 * Remove this entire file in Phase 3.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export function useShows() {
  return useQuery({
    queryKey: queryKeys.shows.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("id, name, created_at")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: queryKeys.workflows.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflows")
        .select("id, name, created_at")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
