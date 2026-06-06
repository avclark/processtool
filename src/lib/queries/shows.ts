import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export const showsQueryOptions = queryOptions({
  queryKey: queryKeys.shows.list(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("shows")
      .select("id, name, slug, status, avatar_url, created_at")
      .order("name");
    if (error) throw error;
    return data;
  },
});

export function showQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.shows.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useShows() {
  return useQuery(showsQueryOptions);
}

export function useShow(id: string) {
  return useQuery(showQueryOptions(id));
}
