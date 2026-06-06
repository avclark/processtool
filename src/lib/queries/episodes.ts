import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export const episodesQueryOptions = queryOptions({
  queryKey: queryKeys.episodes.list(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("episodes")
      .select(
        "id, title, status, progress_percent, created_at, shows(name), workflows(name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export function episodeQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.episodes.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, shows(name), workflows(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useEpisodes() {
  return useQuery(episodesQueryOptions);
}

export function useEpisode(id: string) {
  return useQuery(episodeQueryOptions(id));
}
