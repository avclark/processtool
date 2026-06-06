import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Count of a person's still-open instance tasks. Used to gate person deletion
// (matches v1, which blocks deleting someone with open work assigned). The FK
// is ON DELETE SET NULL, so this is a workflow guard, not a data-loss guard.
export function openTaskCountByUserQueryOptions(userId: string) {
  return queryOptions({
    queryKey: queryKeys.tasks.openCountByUser(userId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_user_id", userId)
        .eq("status", "open");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useOpenTaskCountByUser(userId: string, enabled = true) {
  return useQuery({ ...openTaskCountByUserQueryOptions(userId), enabled });
}
