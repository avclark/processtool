import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import type { Database } from "@/lib/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
// The people list query selects a subset of columns (see queries/people.ts).
type PersonListItem = Pick<
  UserRow,
  "id" | "full_name" | "email" | "role" | "avatar_url" | "created_at"
>;

export interface PersonInput {
  first_name: string;
  last_name: string;
  email: string;
  timezone: string | null;
  role: string;
}

function deriveFullName(input: PersonInput): string {
  return (
    `${input.first_name} ${input.last_name}`.trim() ||
    input.email.split("@")[0]
  );
}

function sortByFullName<T extends { full_name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export function useCreatePerson() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: PersonInput) => {
      // Match v1: reject duplicate emails up front with a friendly message.
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", input.email)
        .maybeSingle();
      if (existing) {
        throw new Error("A person with this email already exists.");
      }

      const { data, error: err } = await supabase
        .from("users")
        .insert({
          full_name: deriveFullName(input),
          first_name: input.first_name || null,
          last_name: input.last_name || null,
          email: input.email,
          timezone: input.timezone,
          role: input.role,
        })
        .select("id, full_name, email, role, avatar_url, created_at")
        .single();
      if (err) throw err;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.all });
      const previous = qc.getQueryData<PersonListItem[]>(
        queryKeys.users.list(),
      );
      const optimistic: PersonListItem = {
        id: `temp-${Date.now()}`,
        full_name: deriveFullName(input),
        email: input.email,
        role: input.role,
        avatar_url: null,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<PersonListItem[]>(queryKeys.users.list(), (old) =>
        sortByFullName(old ? [...old, optimistic] : [optimistic]),
      );
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.users.list(), ctx.previous);
      error(
        "Couldn't add person",
        err instanceof Error ? err.message : "Please try again.",
      );
    },
    onSuccess: () => success("Person added"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: PersonInput & { id: string }) => {
      const { data, error: err } = await supabase
        .from("users")
        .update({
          full_name: deriveFullName(input),
          first_name: input.first_name || null,
          last_name: input.last_name || null,
          email: input.email,
          timezone: input.timezone,
          role: input.role,
        })
        .eq("id", input.id)
        .select("*")
        .single();
      if (err) throw err;
      return data;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.all });
      const prevList = qc.getQueryData<PersonListItem[]>(
        queryKeys.users.list(),
      );
      const prevDetail = qc.getQueryData<UserRow>(
        queryKeys.users.detail(input.id),
      );
      const fullName = deriveFullName(input);
      qc.setQueryData<PersonListItem[]>(queryKeys.users.list(), (old) =>
        old
          ? sortByFullName(
              old.map((p) =>
                p.id === input.id
                  ? {
                      ...p,
                      full_name: fullName,
                      email: input.email,
                      role: input.role,
                    }
                  : p,
              ),
            )
          : old,
      );
      qc.setQueryData<UserRow>(queryKeys.users.detail(input.id), (old) =>
        old
          ? {
              ...old,
              full_name: fullName,
              first_name: input.first_name || null,
              last_name: input.last_name || null,
              email: input.email,
              timezone: input.timezone,
              role: input.role,
            }
          : old,
      );
      return { prevList, prevDetail };
    },
    onError: (_err, input, ctx) => {
      if (ctx?.prevList)
        qc.setQueryData(queryKeys.users.list(), ctx.prevList);
      if (ctx?.prevDetail)
        qc.setQueryData(queryKeys.users.detail(input.id), ctx.prevDetail);
      error("Couldn't update person", "Please try again.");
    },
    onSuccess: () => success("Person updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      // Guard (matches v1): block deletion if the person has open tasks.
      const { count, error: countErr } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_user_id", input.id)
        .eq("status", "open");
      if (countErr) throw countErr;
      if (count && count > 0) {
        throw new Error(
          `This person has ${count} open task${count > 1 ? "s" : ""} assigned. Reassign them before deleting.`,
        );
      }
      // NOTE: deleting the linked Supabase Auth account is deferred to Phase 11
      // (auth) — it needs the service-role key, which never ships to the browser.
      const { error: err } = await supabase
        .from("users")
        .delete()
        .eq("id", input.id);
      if (err) throw err;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.users.all });
      const previous = qc.getQueryData<PersonListItem[]>(
        queryKeys.users.list(),
      );
      // Guard ahead of optimistic removal (same approach as show delete): only
      // drop the row when the cached pre-check says there are no open tasks.
      const openTasks = qc.getQueryData<number>(
        queryKeys.tasks.openCountByUser(input.id),
      );
      if (openTasks === 0) {
        qc.setQueryData<PersonListItem[]>(queryKeys.users.list(), (old) =>
          old?.filter((p) => p.id !== input.id),
        );
      }
      return { previous };
    },
    onError: (err, _input, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.users.list(), ctx.previous);
      error(
        "Couldn't delete person",
        err instanceof Error ? err.message : "Please try again.",
      );
    },
    onSuccess: () => success("Person deleted"),
    onSettled: () => {
      // The user's role memberships and show assignments cascade-delete in the
      // DB; refresh those caches too.
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.roleMembers.all });
      qc.invalidateQueries({ queryKey: queryKeys.showRoleAssignments.all });
    },
  });
}
