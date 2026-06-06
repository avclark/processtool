import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type ShowRow = Database["public"]["Tables"]["shows"]["Row"];
// The list query selects a subset of columns (see queries/shows.ts).
type ShowListItem = Pick<
  ShowRow,
  "id" | "name" | "slug" | "status" | "avatar_url" | "created_at"
>;

// Matches v1: slug is derived from the name, never entered by hand.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

export function useCreateShow() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { name: string; status: string }) => {
      const { data, error: err } = await supabase
        .from("shows")
        .insert({
          name: input.name,
          slug: slugify(input.name),
          status: input.status,
        })
        .select("id, name, slug, status, avatar_url, created_at")
        .single();
      if (err) throw err;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.shows.all });
      const previous = qc.getQueryData<ShowListItem[]>(queryKeys.shows.list());
      const optimistic: ShowListItem = {
        id: `temp-${Date.now()}`,
        name: input.name,
        slug: slugify(input.name),
        status: input.status,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<ShowListItem[]>(queryKeys.shows.list(), (old) =>
        sortByName(old ? [...old, optimistic] : [optimistic]),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.shows.list(), ctx.previous);
      error("Couldn't create show", "Please try again.");
    },
    onSuccess: () => success("Show created"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.shows.all }),
  });
}

export function useUpdateShow() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      status: string;
    }) => {
      const { data, error: err } = await supabase
        .from("shows")
        .update({
          name: input.name,
          slug: slugify(input.name),
          status: input.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select("*")
        .single();
      if (err) throw err;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.shows.all });
      const prevList = qc.getQueryData<ShowListItem[]>(queryKeys.shows.list());
      const prevDetail = qc.getQueryData<ShowRow>(
        queryKeys.shows.detail(input.id),
      );
      const patch = {
        name: input.name,
        slug: slugify(input.name),
        status: input.status,
      };
      qc.setQueryData<ShowListItem[]>(queryKeys.shows.list(), (old) =>
        old
          ? sortByName(
              old.map((s) => (s.id === input.id ? { ...s, ...patch } : s)),
            )
          : old,
      );
      qc.setQueryData<ShowRow>(queryKeys.shows.detail(input.id), (old) =>
        old ? { ...old, ...patch } : old,
      );
      return { prevList, prevDetail };
    },
    onError: (_err, input, ctx) => {
      if (ctx?.prevList)
        qc.setQueryData(queryKeys.shows.list(), ctx.prevList);
      if (ctx?.prevDetail)
        qc.setQueryData(queryKeys.shows.detail(input.id), ctx.prevDetail);
      error("Couldn't update show", "Please try again.");
    },
    onSuccess: () => success("Show updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.shows.all }),
  });
}

export function useDeleteShow() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      // Guard (matches v1): block deletion if episodes reference this show.
      const { count, error: countErr } = await supabase
        .from("episodes")
        .select("id", { count: "exact", head: true })
        .eq("show_id", input.id);
      if (countErr) throw countErr;
      if (count && count > 0) {
        throw new Error(
          `This show has ${count} episode${count > 1 ? "s" : ""}. Delete or reassign them before deleting this show.`,
        );
      }
      const { error: err } = await supabase
        .from("shows")
        .delete()
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.shows.all });
      const previous = qc.getQueryData<ShowListItem[]>(queryKeys.shows.list());
      // Guard ahead of the optimistic removal: only drop the row when the
      // cached pre-check (populated by the delete dialog) confirms the show has
      // no episodes. Otherwise we'd remove a row the mutationFn will refuse to
      // delete, causing it to disappear and then reappear. The mutationFn keeps
      // the authoritative episode guard regardless of this cache.
      const episodeCount = qc.getQueryData<number>(
        queryKeys.episodes.countByShow(input.id),
      );
      if (episodeCount === 0) {
        qc.setQueryData<ShowListItem[]>(queryKeys.shows.list(), (old) =>
          old?.filter((s) => s.id !== input.id),
        );
      }
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.shows.list(), ctx.previous);
      error(
        "Couldn't delete show",
        err instanceof Error ? err.message : "Please try again.",
      );
    },
    onSuccess: () => success("Show deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.shows.all }),
  });
}
