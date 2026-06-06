import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// Global production roles (e.g. "Video Editor", "Producer"). Not bound to a
// workflow — workspace-wide.
export const rolesQueryOptions = queryOptions({
  queryKey: queryKeys.roles.list(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("display_order");
    if (error) throw error;
    return data;
  },
});

// The pool of people qualified to fill each role (eligibility, not assignment).
export const roleMembersQueryOptions = queryOptions({
  queryKey: queryKeys.roleMembers.list(),
  queryFn: async () => {
    const { data, error } = await supabase.from("role_members").select("*");
    if (error) throw error;
    return data;
  },
});

// Who is actually assigned to each role on a given show. UNIQUE(show_id, role_id)
// — one person per role per show.
export function showRoleAssignmentsQueryOptions(showId: string) {
  return queryOptions({
    queryKey: queryKeys.showRoleAssignments.byShow(showId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("show_role_assignments")
        .select("*")
        .eq("show_id", showId);
      if (error) throw error;
      return data;
    },
  });
}

export function useRoles() {
  return useQuery(rolesQueryOptions);
}

export function useRoleMembers() {
  return useQuery(roleMembersQueryOptions);
}

export function useShowRoleAssignments(showId: string) {
  return useQuery(showRoleAssignmentsQueryOptions(showId));
}
