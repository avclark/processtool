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

// Immediate-persist reorder (matches v1): on drop, write position 0..n for the
// new order. Optimistic; success is silent (reordering is frequent).
export function useReorderTaskTemplates(processId: string) {
  const qc = useQueryClient();
  const { error } = useToast();
  const key = queryKeys.taskTemplates.byProcess(processId);

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const results = await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("task_templates").update({ position: i }).eq("id", id),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskTemplateRow[]>(key);
      if (previous) {
        const byId = new Map(previous.map((t) => [t.id, t]));
        const reordered = orderedIds
          .map((id, i) => {
            const t = byId.get(id);
            return t ? { ...t, position: i } : null;
          })
          .filter((t): t is TaskTemplateRow => !!t);
        qc.setQueryData<TaskTemplateRow[]>(key, reordered);
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      error("Couldn't reorder tasks", "Please try again.");
    },
    // Intentionally NO settle-invalidate: the optimistic update already writes
    // position 0..n, exactly what we persist, so the cache is authoritative. A
    // refetch here would cause a second render that re-measures the sortable
    // list and produces a visible bounce/flash on the reordered rows.
  });
}

// Deep-copies a task template and ALL its children into the same process,
// inserted right after the original. New ids are generated by the DB; the copy's
// title gets a " (copy)" suffix and following templates shift down by one.
// Dependency / date-rule references to sibling templates are kept as-is (same
// process, so they remain valid). NOTE: this is a simple control for now —
// Phase 9: trigger this from the command palette too.
export function useDuplicateTaskTemplate(processId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const key = queryKeys.taskTemplates.byProcess(processId);

  return useMutation({
    mutationFn: async (input: { templateId: string }) => {
      const { data: source, error: srcErr } = await supabase
        .from("task_templates")
        .select("*")
        .eq("id", input.templateId)
        .single();
      if (srcErr) throw srcErr;

      // Shift everything after the source down by one to make room.
      const { data: toShift, error: shiftSelErr } = await supabase
        .from("task_templates")
        .select("id, position")
        .eq("process_id", processId)
        .gt("position", source.position)
        .order("position", { ascending: false });
      if (shiftSelErr) throw shiftSelErr;
      for (const t of toShift ?? []) {
        const { error: shiftErr } = await supabase
          .from("task_templates")
          .update({ position: t.position + 1 })
          .eq("id", t.id);
        if (shiftErr) throw shiftErr;
      }

      // Insert the new template.
      const { data: copy, error: insErr } = await supabase
        .from("task_templates")
        .insert({
          process_id: processId,
          title: `${source.title} (copy)`,
          description: source.description,
          position: source.position + 1,
          assignment_mode: source.assignment_mode,
          assigned_role_id: source.assigned_role_id,
          assigned_user_id: source.assigned_user_id,
          visibility_logic: source.visibility_logic,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      const newId = copy.id;

      // Deep-copy every child collection, pointing at the new template id.
      const [blocks, rules, deps, dateRules, actions, emailTemplate] =
        await Promise.all([
          supabase
            .from("task_template_blocks")
            .select("*")
            .eq("task_template_id", input.templateId),
          supabase
            .from("task_template_visibility_rules")
            .select("*")
            .eq("task_template_id", input.templateId),
          supabase
            .from("task_template_dependencies")
            .select("*")
            .eq("task_template_id", input.templateId),
          supabase
            .from("task_template_date_rules")
            .select("*")
            .eq("task_template_id", input.templateId),
          supabase
            .from("task_template_completion_actions")
            .select("*")
            .eq("task_template_id", input.templateId),
          supabase
            .from("task_template_email_templates")
            .select("*")
            .eq("task_template_id", input.templateId)
            .maybeSingle(),
        ]);
      const childErr =
        blocks.error ||
        rules.error ||
        deps.error ||
        dateRules.error ||
        actions.error ||
        emailTemplate.error;
      if (childErr) throw childErr;

      const inserts: PromiseLike<{ error: unknown }>[] = [];
      if (blocks.data?.length)
        inserts.push(
          supabase.from("task_template_blocks").insert(
            blocks.data.map((b) => ({
              task_template_id: newId,
              block_type: b.block_type,
              label: b.label,
              required: b.required,
              options_json: b.options_json,
              display_order: b.display_order,
              token_name: b.token_name,
            })),
          ),
        );
      if (rules.data?.length)
        inserts.push(
          supabase.from("task_template_visibility_rules").insert(
            rules.data.map((r) => ({
              task_template_id: newId,
              name: r.name,
              setting_definition_id: r.setting_definition_id,
              operator: r.operator,
              target_value: r.target_value,
              is_active: r.is_active,
            })),
          ),
        );
      if (deps.data?.length)
        inserts.push(
          supabase.from("task_template_dependencies").insert(
            deps.data.map((d) => ({
              task_template_id: newId,
              depends_on_task_template_id: d.depends_on_task_template_id,
              condition_type: d.condition_type,
            })),
          ),
        );
      if (dateRules.data?.length)
        inserts.push(
          supabase.from("task_template_date_rules").insert(
            dateRules.data.map((d) => ({
              task_template_id: newId,
              date_field: d.date_field,
              relative_to: d.relative_to,
              relative_task_template_id: d.relative_task_template_id,
              offset_days: d.offset_days,
              offset_hours: d.offset_hours,
            })),
          ),
        );
      if (actions.data?.length)
        inserts.push(
          supabase.from("task_template_completion_actions").insert(
            actions.data.map((a) => ({
              task_template_id: newId,
              action_type: a.action_type,
              config_json: a.config_json,
            })),
          ),
        );
      if (emailTemplate.data)
        inserts.push(
          supabase.from("task_template_email_templates").insert({
            task_template_id: newId,
            from_name: emailTemplate.data.from_name,
            subject_template: emailTemplate.data.subject_template,
            body_template: emailTemplate.data.body_template,
            auto_send_on_complete: emailTemplate.data.auto_send_on_complete,
          }),
        );

      const results = await Promise.all(inserts);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<TaskTemplateRow[]>(key);
      const source = previous?.find((t) => t.id === input.templateId);
      if (previous && source) {
        const shifted = previous.map((t) =>
          t.position > source.position
            ? { ...t, position: t.position + 1 }
            : t,
        );
        const optimisticCopy: TaskTemplateRow = {
          ...source,
          id: `temp-${Date.now()}`,
          title: `${source.title} (copy)`,
          position: source.position + 1,
        };
        qc.setQueryData<TaskTemplateRow[]>(
          key,
          byPosition([...shifted, optimisticCopy]),
        );
      }
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      error("Couldn't duplicate task", "Please try again.");
    },
    onSuccess: () => success("Task duplicated"),
    onSettled: () => {
      // Reconcile the optimistic placeholder with the real row + children.
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: queryKeys.processes.all });
    },
  });
}
