import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type ProcessRow = Database["public"]["Tables"]["processes"]["Row"];
// The list query augments each process with its nested task ids + a count.
type ProcessListItem = Pick<ProcessRow, "id" | "name" | "created_at"> & {
  task_templates: { id: string }[];
  taskCount: number;
};

function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

export function useCreateProcess() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const { data, error: err } = await supabase
        .from("processes")
        .insert({ name: input.name })
        .select("id, name, created_at")
        .single();
      if (err) throw err;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.processes.all });
      const previous = qc.getQueryData<ProcessListItem[]>(
        queryKeys.processes.list(),
      );
      const optimistic: ProcessListItem = {
        id: `temp-${Date.now()}`,
        name: input.name,
        created_at: new Date().toISOString(),
        task_templates: [],
        taskCount: 0,
      };
      qc.setQueryData<ProcessListItem[]>(queryKeys.processes.list(), (old) =>
        sortByName(old ? [...old, optimistic] : [optimistic]),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.processes.list(), ctx.previous);
      error("Couldn't create process", "Please try again.");
    },
    onSuccess: () => success("Process created"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.processes.all }),
  });
}

export function useRenameProcess() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error: err } = await supabase
        .from("processes")
        .update({ name: input.name, updated_at: new Date().toISOString() })
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.processes.all });
      const prevList = qc.getQueryData<ProcessListItem[]>(
        queryKeys.processes.list(),
      );
      const prevDetail = qc.getQueryData<ProcessRow>(
        queryKeys.processes.detail(input.id),
      );
      qc.setQueryData<ProcessListItem[]>(queryKeys.processes.list(), (old) =>
        old
          ? sortByName(
              old.map((p) =>
                p.id === input.id ? { ...p, name: input.name } : p,
              ),
            )
          : old,
      );
      qc.setQueryData<ProcessRow>(queryKeys.processes.detail(input.id), (old) =>
        old ? { ...old, name: input.name } : old,
      );
      return { prevList, prevDetail };
    },
    onError: (_err, input, ctx) => {
      if (ctx?.prevList)
        qc.setQueryData(queryKeys.processes.list(), ctx.prevList);
      if (ctx?.prevDetail)
        qc.setQueryData(queryKeys.processes.detail(input.id), ctx.prevDetail);
      error("Couldn't rename process", "Please try again.");
    },
    onSuccess: () => success("Process renamed"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.processes.all }),
  });
}

export function useDeleteProcess() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      // Guard: block deletion if any workflow or episode references this process.
      // workflows.process_id is ON DELETE SET NULL (v1 blocks it anyway); but
      // episodes.process_id is ON DELETE CASCADE, so deleting would silently
      // destroy episodes — this throw is the authoritative backstop.
      const [{ count: wfCount, error: wfErr }, { count: epCount, error: epErr }] =
        await Promise.all([
          supabase
            .from("workflows")
            .select("id", { count: "exact", head: true })
            .eq("process_id", input.id),
          supabase
            .from("episodes")
            .select("id", { count: "exact", head: true })
            .eq("process_id", input.id),
        ]);
      if (wfErr) throw wfErr;
      if (epErr) throw epErr;
      const parts: string[] = [];
      if (wfCount && wfCount > 0)
        parts.push(`${wfCount} workflow${wfCount > 1 ? "s" : ""}`);
      if (epCount && epCount > 0)
        parts.push(`${epCount} episode${epCount > 1 ? "s" : ""}`);
      if (parts.length > 0) {
        throw new Error(
          `This process is used by ${parts.join(" and ")}. Remove those references before deleting.`,
        );
      }
      const { error: err } = await supabase
        .from("processes")
        .delete()
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.processes.all });
      const previous = qc.getQueryData<ProcessListItem[]>(
        queryKeys.processes.list(),
      );
      // Gate optimistic removal on the cached pre-check counts (populated by the
      // delete dialog): only drop the row when nothing references the process.
      const wf = qc.getQueryData<number>(
        queryKeys.workflows.countByProcess(input.id),
      );
      const ep = qc.getQueryData<number>(
        queryKeys.episodes.countByProcess(input.id),
      );
      if (wf === 0 && ep === 0) {
        qc.setQueryData<ProcessListItem[]>(queryKeys.processes.list(), (old) =>
          old?.filter((p) => p.id !== input.id),
        );
      }
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.processes.list(), ctx.previous);
      error(
        "Couldn't delete process",
        err instanceof Error ? err.message : "Please try again.",
      );
    },
    onSuccess: () => success("Process deleted"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.processes.all }),
  });
}
