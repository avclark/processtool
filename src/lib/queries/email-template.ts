import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";

// The (optional) email template for a task template. At most one row per template.
export function emailTemplateQueryOptions(templateId: string) {
  return queryOptions({
    queryKey: queryKeys.emailTemplate.byTemplate(templateId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_template_email_templates")
        .select("*")
        .eq("task_template_id", templateId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useEmailTemplate(templateId: string) {
  return useQuery(emailTemplateQueryOptions(templateId));
}
