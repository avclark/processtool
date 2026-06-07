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

// Lightweight count of episodes for a show. Used to gate show deletion (the
// FK is ON DELETE CASCADE, so deleting a show would otherwise take its episodes
// with it). `head: true` fetches only the count, no rows.
export function episodeCountByShowQueryOptions(showId: string) {
  return queryOptions({
    queryKey: queryKeys.episodes.countByShow(showId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("episodes")
        .select("id", { count: "exact", head: true })
        .eq("show_id", showId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// Count of episodes referencing a process. Gates process deletion — the FK
// episodes.process_id → processes is ON DELETE CASCADE, so this is a data-loss
// guard, not just a workflow-integrity one.
export function episodeCountByProcessQueryOptions(processId: string) {
  return queryOptions({
    queryKey: queryKeys.episodes.countByProcess(processId),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("episodes")
        .select("id", { count: "exact", head: true })
        .eq("process_id", processId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useEpisodes() {
  return useQuery(episodesQueryOptions);
}

export function useEpisodeCountByProcess(processId: string, enabled = true) {
  return useQuery({
    ...episodeCountByProcessQueryOptions(processId),
    enabled,
  });
}

export function useEpisodeCountByShow(showId: string, enabled = true) {
  return useQuery({ ...episodeCountByShowQueryOptions(showId), enabled });
}

export function useEpisode(id: string) {
  return useQuery(episodeQueryOptions(id));
}
