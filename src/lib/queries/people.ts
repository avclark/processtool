import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

export const peopleQueryOptions = queryOptions({
  queryKey: queryKeys.users.list(),
  queryFn: async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, avatar_url, created_at")
      .order("full_name");
    if (error) throw error;
    return data;
  },
});

export function personQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function usePeople() {
  return useQuery(peopleQueryOptions);
}

export function usePerson(id: string) {
  return useQuery(personQueryOptions(id));
}
