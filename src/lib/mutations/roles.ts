import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type AssignmentRow =
  Database["public"]["Tables"]["show_role_assignments"]["Row"];
type Role = Database["public"]["Tables"]["roles"]["Row"];
type RoleMemberRow = Database["public"]["Tables"]["role_members"]["Row"];

export interface RoleAssignmentInput {
  role_id: string;
  user_id: string | null;
}

// Saves the full set of role assignments for one show. Matches v1:
// delete-all-for-show, then insert the rows that actually have a person
// (unassigned roles are simply omitted). Relies on UNIQUE(show_id, role_id).
export function useSaveShowRoleAssignments(showId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (assignments: RoleAssignmentInput[]) => {
      const { error: delErr } = await supabase
        .from("show_role_assignments")
        .delete()
        .eq("show_id", showId);
      if (delErr) throw delErr;

      const toInsert = assignments
        .filter((a) => a.user_id)
        .map((a) => ({
          show_id: showId,
          role_id: a.role_id,
          user_id: a.user_id as string,
        }));
      if (toInsert.length > 0) {
        const { error: insErr } = await supabase
          .from("show_role_assignments")
          .insert(toInsert);
        if (insErr) throw insErr;
      }
    },
    onMutate: async (assignments) => {
      const key = queryKeys.showRoleAssignments.byShow(showId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<AssignmentRow[]>(key);
      const optimistic: AssignmentRow[] = assignments
        .filter((a) => a.user_id)
        .map((a) => ({
          id: `temp-${a.role_id}`,
          show_id: showId,
          role_id: a.role_id,
          user_id: a.user_id as string,
        }));
      qc.setQueryData<AssignmentRow[]>(key, optimistic);
      return { previous };
    },
    onError: (_err, _assignments, ctx) => {
      qc.setQueryData(
        queryKeys.showRoleAssignments.byShow(showId),
        ctx?.previous,
      );
      error("Couldn't save role assignments", "Please try again.");
    },
    onSuccess: () => success("Role assignments saved"),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.showRoleAssignments.byShow(showId),
      }),
  });
}

// ---------------------------------------------------------------------------
// Production-role taxonomy + member pools (managed in the People area).
// ---------------------------------------------------------------------------

export function useCreateRole() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { name: string }) => {
      // next display_order = current max + 1 (matches v1).
      const { data: existing } = await supabase
        .from("roles")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1);
      const nextOrder =
        existing && existing.length > 0 ? existing[0].display_order + 1 : 0;
      const { data, error: err } = await supabase
        .from("roles")
        .insert({ name: input.name, display_order: nextOrder })
        .select("*")
        .single();
      if (err) throw err;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.roles.all });
      const previous = qc.getQueryData<Role[]>(queryKeys.roles.list());
      const optimistic: Role = {
        id: `temp-${Date.now()}`,
        name: input.name,
        display_order: previous?.length ?? 0,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<Role[]>(queryKeys.roles.list(), (old) =>
        old ? [...old, optimistic] : [optimistic],
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.roles.list(), ctx.previous);
      error("Couldn't create role", "Please try again.");
    },
    onSuccess: () => success("Role created"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.roles.all }),
  });
}

export function useRenameRole() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error: err } = await supabase
        .from("roles")
        .update({ name: input.name })
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.roles.all });
      const previous = qc.getQueryData<Role[]>(queryKeys.roles.list());
      qc.setQueryData<Role[]>(queryKeys.roles.list(), (old) =>
        old?.map((r) =>
          r.id === input.id ? { ...r, name: input.name } : r,
        ),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.roles.list(), ctx.previous);
      error("Couldn't rename role", "Please try again.");
    },
    onSuccess: () => success("Role renamed"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.roles.all }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      // Guard (matches v1): block deletion if templates or show assignments
      // still reference this role.
      const { count: templateCount } = await supabase
        .from("task_templates")
        .select("id", { count: "exact", head: true })
        .eq("assigned_role_id", input.id);
      const { count: assignmentCount } = await supabase
        .from("show_role_assignments")
        .select("id", { count: "exact", head: true })
        .eq("role_id", input.id);
      const warnings: string[] = [];
      if (templateCount && templateCount > 0)
        warnings.push(
          `${templateCount} task template${templateCount > 1 ? "s" : ""}`,
        );
      if (assignmentCount && assignmentCount > 0)
        warnings.push(
          `${assignmentCount} show assignment${assignmentCount > 1 ? "s" : ""}`,
        );
      if (warnings.length > 0) {
        throw new Error(
          `This role is used by ${warnings.join(" and ")}. Remove those references before deleting.`,
        );
      }
      const { error: err } = await supabase
        .from("roles")
        .delete()
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.roles.all });
      const previous = qc.getQueryData<Role[]>(queryKeys.roles.list());
      qc.setQueryData<Role[]>(queryKeys.roles.list(), (old) =>
        old?.filter((r) => r.id !== input.id),
      );
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.roles.list(), ctx.previous);
      error(
        "Couldn't delete role",
        err instanceof Error ? err.message : "Please try again.",
      );
    },
    onSuccess: () => success("Role deleted"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.roles.all });
      qc.invalidateQueries({ queryKey: queryKeys.roleMembers.all });
    },
  });
}

export function useAddRoleMember() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { role_id: string; user_id: string }) => {
      const { error: err } = await supabase
        .from("role_members")
        .insert({ role_id: input.role_id, user_id: input.user_id });
      if (err) {
        if (err.code === "23505")
          throw new Error("This person is already in this role.");
        throw err;
      }
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.roleMembers.all });
      const previous = qc.getQueryData<RoleMemberRow[]>(
        queryKeys.roleMembers.list(),
      );
      const optimistic: RoleMemberRow = {
        id: `temp-${Date.now()}`,
        role_id: input.role_id,
        user_id: input.user_id,
      };
      qc.setQueryData<RoleMemberRow[]>(queryKeys.roleMembers.list(), (old) =>
        old ? [...old, optimistic] : [optimistic],
      );
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.roleMembers.list(), ctx.previous);
      error(
        "Couldn't add member",
        err instanceof Error ? err.message : "Please try again.",
      );
    },
    onSuccess: () => success("Member added"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.roleMembers.all }),
  });
}

export function useRemoveRoleMember() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { role_id: string; user_id: string }) => {
      const { error: err } = await supabase
        .from("role_members")
        .delete()
        .eq("role_id", input.role_id)
        .eq("user_id", input.user_id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.roleMembers.all });
      const previous = qc.getQueryData<RoleMemberRow[]>(
        queryKeys.roleMembers.list(),
      );
      qc.setQueryData<RoleMemberRow[]>(queryKeys.roleMembers.list(), (old) =>
        old?.filter(
          (m) =>
            !(m.role_id === input.role_id && m.user_id === input.user_id),
        ),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.roleMembers.list(), ctx.previous);
      error("Couldn't remove member", "Please try again.");
    },
    onSuccess: () => success("Member removed"),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.roleMembers.all }),
  });
}
