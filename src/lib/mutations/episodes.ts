import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/ui/toast";
import {
  generateEpisodeTasks,
  type BlockInput,
  type DateRuleInput,
  type VisibilityRuleInput,
} from "@/lib/episode-generation";
import type { Json } from "@/lib/database.types";

export interface CreateEpisodeInput {
  processId: string;
  showId: string;
  title: string;
}

// Generates an episode's task list from its process. Pure logic lives in
// episode-generation.ts; this hook fetches the inputs, runs it, and writes the
// rows. Not transactional, so a mid-write failure deletes the episode (FK
// cascade removes any partial tasks/blocks) — no orphans.
export function useCreateEpisode(workflowId: string) {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ processId, showId, title }: CreateEpisodeInput) => {
      // 1. Templates for the process.
      const { data: templates, error: tErr } = await supabase
        .from("task_templates")
        .select(
          "id, title, position, assignment_mode, assigned_role_id, assigned_user_id, visibility_logic",
        )
        .eq("process_id", processId)
        .order("position");
      if (tErr) throw tErr;
      const templateIds = (templates ?? []).map((t) => t.id);

      // 2. Show data (always) + template children (only if there are templates;
      // avoids an empty `.in()`).
      const [settingVals, roleAssigns] = await Promise.all([
        supabase
          .from("show_setting_values")
          .select("setting_definition_id, value_json")
          .eq("show_id", showId),
        supabase
          .from("show_role_assignments")
          .select("role_id, user_id")
          .eq("show_id", showId),
      ]);
      if (settingVals.error) throw settingVals.error;
      if (roleAssigns.error) throw roleAssigns.error;

      const blocksByTemplate: Record<string, BlockInput[]> = {};
      const visibilityRulesByTemplate: Record<string, VisibilityRuleInput[]> = {};
      const dependenciesByTemplate: Record<string, string[]> = {};
      const dateRulesByTemplate: Record<string, DateRuleInput[]> = {};

      if (templateIds.length) {
        const [blocks, rules, deps, dateRules] = await Promise.all([
          supabase
            .from("task_template_blocks")
            .select(
              "task_template_id, block_type, label, required, options_json, display_order",
            )
            .in("task_template_id", templateIds)
            .order("display_order"),
          supabase
            .from("task_template_visibility_rules")
            .select(
              "task_template_id, setting_definition_id, operator, target_value, is_active",
            )
            .in("task_template_id", templateIds),
          supabase
            .from("task_template_dependencies")
            .select("task_template_id, depends_on_task_template_id")
            .in("task_template_id", templateIds),
          supabase
            .from("task_template_date_rules")
            .select(
              "task_template_id, date_field, relative_to, relative_task_template_id, offset_days, offset_hours",
            )
            .in("task_template_id", templateIds),
        ]);
        const childErr =
          blocks.error || rules.error || deps.error || dateRules.error;
        if (childErr) throw childErr;

        for (const b of blocks.data ?? [])
          (blocksByTemplate[b.task_template_id] ??= []).push({
            block_type: b.block_type,
            label: b.label,
            required: b.required,
            options_json: b.options_json,
            display_order: b.display_order,
          });
        for (const r of rules.data ?? [])
          (visibilityRulesByTemplate[r.task_template_id] ??= []).push({
            setting_definition_id: r.setting_definition_id,
            operator: r.operator,
            target_value: r.target_value,
            is_active: r.is_active,
          });
        for (const d of deps.data ?? [])
          (dependenciesByTemplate[d.task_template_id] ??= []).push(
            d.depends_on_task_template_id,
          );
        for (const dr of dateRules.data ?? [])
          (dateRulesByTemplate[dr.task_template_id] ??= []).push({
            date_field: dr.date_field as DateRuleInput["date_field"],
            relative_to: dr.relative_to as DateRuleInput["relative_to"],
            relative_task_template_id: dr.relative_task_template_id,
            offset_days: dr.offset_days,
            offset_hours: dr.offset_hours,
          });
      }

      const settingValues: Record<string, Json | null> = {};
      for (const s of settingVals.data ?? [])
        settingValues[s.setting_definition_id] = s.value_json;
      const roleAssignments: Record<string, string> = {};
      for (const r of roleAssigns.data ?? [])
        roleAssignments[r.role_id] = r.user_id;

      // 3. Pure generation.
      const generated = generateEpisodeTasks({
        templates: templates ?? [],
        blocksByTemplate,
        visibilityRulesByTemplate,
        dependenciesByTemplate,
        dateRulesByTemplate,
        settingValues,
        roleAssignments,
        now: new Date().toISOString(),
      });

      // 4. Insert the episode.
      const { data: episode, error: epErr } = await supabase
        .from("episodes")
        .insert({
          workflow_id: workflowId,
          process_id: processId,
          show_id: showId,
          title,
          status: "active",
          progress_percent: 0,
        })
        .select("id")
        .single();
      if (epErr) throw epErr;
      const episodeId = episode.id;

      // 5. Write tasks + instance blocks; clean up the episode on any failure.
      try {
        if (generated.length) {
          const { data: insertedTasks, error: taskErr } = await supabase
            .from("tasks")
            .insert(
              generated.map((g) => ({
                episode_id: episodeId,
                task_template_id: g.task_template_id,
                title: g.title,
                position: g.position,
                status: g.status,
                is_visible: g.is_visible,
                assigned_user_id: g.assigned_user_id,
                start_date: g.start_date,
                due_date: g.due_date,
                hidden_template_block_ids: [] as Json,
                instance_actions: [] as Json,
                instance_email_template: null,
                instance_visibility_rules:
                  g.instance_visibility_rules as unknown as Json,
                instance_dependencies: g.instance_dependencies as unknown as Json,
              })),
            )
            .select("id, task_template_id");
          if (taskErr) throw taskErr;

          const instanceIdByTemplate: Record<string, string> = {};
          for (const row of insertedTasks ?? [])
            instanceIdByTemplate[row.task_template_id] = row.id;

          const blockRows = generated.flatMap((g) =>
            g.blocks.map((b) => ({
              task_id: instanceIdByTemplate[g.task_template_id],
              block_type: b.block_type,
              label: b.label,
              required: b.required,
              options_json: b.options_json,
              display_order: b.display_order,
            })),
          );
          if (blockRows.length) {
            const { error: blkErr } = await supabase
              .from("task_instance_blocks")
              .insert(blockRows);
            if (blkErr) throw blkErr;
          }
        }
      } catch (writeErr) {
        await supabase.from("episodes").delete().eq("id", episodeId);
        throw writeErr;
      }

      return { episodeId };
    },
    onError: () => error("Couldn't create episode", "Please try again."),
    onSuccess: () => success("Episode created"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.episodes.all }),
  });
}

// Deletes an episode. episodes → tasks is ON DELETE CASCADE, so this also
// removes the generated task list (the delete dialog confirms that explicitly).
export function useDeleteEpisode() {
  const qc = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const { error: err } = await supabase
        .from("episodes")
        .delete()
        .eq("id", input.id);
      if (err) throw err;
    },
    onError: () => error("Couldn't delete episode", "Please try again."),
    onSuccess: () => success("Episode deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.episodes.all }),
  });
}
