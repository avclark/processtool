import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type TaskTemplateRow = Database["public"]["Tables"]["task_templates"]["Row"];

function byPosition(rows: TaskTemplateRow[]): TaskTemplateRow[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

// New task templates append at the end. Reordering is Phase 6.
export function useCreateTaskTemplate(processId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.taskTemplates.byProcess(processId);

  return useMutation({
    mutationFn: async (input: { title: string }) => {
      const { data: last } = await supabase
        .from("task_templates")
        .select("position")
        .eq("process_id", processId)
        .order("position", { ascending: false })
        .limit(1);
      const nextPosition =
        last && last.length > 0 ? last[0].position + 1 : 0;
      const { data, error: err } = await supabase
        .from("task_templates")
        .insert({
          process_id: processId,
          title: input.title,
          position: nextPosition,
        })
        .select("*")
        .single();
      if (err) throw err;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskTemplateRow[]>(key);
      const nextPosition = previous?.length
        ? Math.max(...previous.map((t) => t.position)) + 1
        : 0;
      const optimistic: TaskTemplateRow = {
        id: `temp-${Date.now()}`,
        process_id: processId,
        title: input.title,
        description: null,
        position: nextPosition,
        assignment_mode: "none",
        assigned_role_id: null,
        assigned_user_id: null,
        visibility_logic: "and",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData<TaskTemplateRow[]>(key, (old) =>
        byPosition(old ? [...old, optimistic] : [optimistic]),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      error("Couldn't add task", "Please try again.");
    },
    onSuccess: () => success("Task added"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: queryKeys.processes.all });
    },
  });
}

export function useRenameTaskTemplate(processId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.taskTemplates.byProcess(processId);

  return useMutation({
    mutationFn: async (input: { id: string; title: string }) => {
      const { error: err } = await supabase
        .from("task_templates")
        .update({ title: input.title, updated_at: new Date().toISOString() })
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskTemplateRow[]>(key);
      qc.setQueryData<TaskTemplateRow[]>(key, (old) =>
        old?.map((t) =>
          t.id === input.id ? { ...t, title: input.title } : t,
        ),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      error("Couldn't rename task", "Please try again.");
    },
    onSuccess: () => success("Task renamed"),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateTaskTemplateAssignment(processId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.taskTemplates.byProcess(processId);

  return useMutation({
    mutationFn: async (input: {
      id: string;
      mode: "none" | "role" | "user";
      roleId: string | null;
      userId: string | null;
    }) => {
      const { error: err } = await supabase
        .from("task_templates")
        .update({
          assignment_mode: input.mode,
          assigned_role_id: input.mode === "role" ? input.roleId : null,
          assigned_user_id: input.mode === "user" ? input.userId : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskTemplateRow[]>(key);
      qc.setQueryData<TaskTemplateRow[]>(key, (old) =>
        old?.map((t) =>
          t.id === input.id
            ? {
                ...t,
                assignment_mode: input.mode,
                assigned_role_id: input.mode === "role" ? input.roleId : null,
                assigned_user_id: input.mode === "user" ? input.userId : null,
              }
            : t,
        ),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      error("Couldn't save assignment", "Please try again.");
    },
    onSuccess: () => success("Assignment saved"),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteTaskTemplate(processId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.taskTemplates.byProcess(processId);

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const { error: err } = await supabase
        .from("task_templates")
        .delete()
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskTemplateRow[]>(key);
      qc.setQueryData<TaskTemplateRow[]>(key, (old) =>
        old?.filter((t) => t.id !== input.id),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      error("Couldn't delete task", "Please try again.");
    },
    onSuccess: () => success("Task deleted"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: queryKeys.processes.all });
    },
  });
}
