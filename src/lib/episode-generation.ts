// Pure episode-generation logic — NO Supabase / network / clock access.
//
// Given a process's templates (+ their blocks/rules) and a show's setting values
// + role assignments, compute the set of task-instance rows to create when an
// episode is stamped out. This is the most logic-dense behavior in the build, so
// it lives here as a pure, unit-tested function separate from the DB writes.
//
// `now` is passed in (ISO string) rather than read from the clock, so the
// function is deterministic and testable.
import type { Json } from "@/lib/database.types";

export type DateField = "start_date" | "due_date";
export type RelativeTo = "episode_start" | "task_start" | "task_due";

export interface TemplateInput {
  id: string;
  title: string;
  position: number;
  assignment_mode: string; // 'none' | 'role' | 'user'
  assigned_role_id: string | null;
  assigned_user_id: string | null;
  visibility_logic: string; // 'and' | 'or'
}

export interface VisibilityRuleInput {
  setting_definition_id: string;
  operator: string;
  target_value: string | null;
  is_active: boolean;
}

export interface DependencyInput {
  depends_on_task_template_id: string;
}

export interface DateRuleInput {
  date_field: DateField;
  relative_to: RelativeTo;
  relative_task_template_id: string | null;
  offset_days: number;
  offset_hours: number;
}

export interface BlockInput {
  block_type: string;
  label: string;
  required: boolean;
  options_json: Json | null;
  display_order: number;
}

export interface GenerateInput {
  templates: TemplateInput[];
  blocksByTemplate: Record<string, BlockInput[]>;
  visibilityRulesByTemplate: Record<string, VisibilityRuleInput[]>;
  /** template id -> the task_template_ids it depends on */
  dependenciesByTemplate: Record<string, string[]>;
  dateRulesByTemplate: Record<string, DateRuleInput[]>;
  /** setting_definition_id -> the show's value_json */
  settingValues: Record<string, Json | null>;
  /** role_id -> user_id (from show_role_assignments) */
  roleAssignments: Record<string, string>;
  /** episode creation time, ISO string */
  now: string;
}

export interface GeneratedTask {
  task_template_id: string;
  title: string;
  position: number;
  is_visible: boolean;
  status: "open" | "blocked";
  assigned_user_id: string | null;
  start_date: string | null;
  due_date: string | null;
  /** snapshot so the instance can be re-evaluated without the template */
  instance_visibility_rules: { logic: string; rules: VisibilityRuleInput[] };
  /** snapshot of the depends-on task_template_ids (resolvable within the episode) */
  instance_dependencies: string[];
  blocks: BlockInput[];
}

export function generateEpisodeTasks(input: GenerateInput): GeneratedTask[] {
  const {
    templates,
    blocksByTemplate,
    visibilityRulesByTemplate,
    dependenciesByTemplate,
    dateRulesByTemplate,
    settingValues,
    roleAssignments,
    now,
  } = input;

  const ordered = [...templates].sort((a, b) => a.position - b.position);

  // 1. Visibility per template.
  const visible: Record<string, boolean> = {};
  for (const t of ordered) {
    visible[t.id] = evaluateVisibility(
      t.visibility_logic,
      visibilityRulesByTemplate[t.id] ?? [],
      settingValues,
    );
  }

  // 2. Dates — two passes (episode-relative first, then task-relative which may
    // read the pass-1 results). No cascade beyond this (Phase 8).
  const dates: Record<string, { start_date: string | null; due_date: string | null }> =
    {};
  for (const t of ordered) dates[t.id] = { start_date: null, due_date: null };

  // Pass 1: episode_start-relative.
  for (const t of ordered) {
    for (const rule of dateRulesByTemplate[t.id] ?? []) {
      if (rule.relative_to === "episode_start") {
        dates[t.id][rule.date_field] = addInterval(
          now,
          rule.offset_days,
          rule.offset_hours,
        );
      }
    }
  }

  // Pass 2: task-relative (reads pass-1 dates of the anchor task; null anchor → null).
  for (const t of ordered) {
    for (const rule of dateRulesByTemplate[t.id] ?? []) {
      if (rule.relative_to === "episode_start") continue;
      const anchorId = rule.relative_task_template_id;
      if (!anchorId) continue;
      const anchor = dates[anchorId];
      const anchorDate =
        rule.relative_to === "task_start"
          ? (anchor?.start_date ?? null)
          : (anchor?.due_date ?? null);
      if (anchorDate != null) {
        dates[t.id][rule.date_field] = addInterval(
          anchorDate,
          rule.offset_days,
          rule.offset_hours,
        );
      }
    }
  }

  // 3. Assemble.
  return ordered.map((t) => {
    const deps = dependenciesByTemplate[t.id] ?? [];
    return {
      task_template_id: t.id,
      title: t.title,
      position: t.position,
      is_visible: visible[t.id],
      // Blocked if the task has ANY dependency — at creation nothing is complete,
      // and a hidden prerequisite is NOT auto-satisfied (a visible task depending
      // on a hidden one stays blocked so the misconfiguration surfaces).
      status: deps.length > 0 ? "blocked" : "open",
      assigned_user_id: resolveAssignment(t, roleAssignments),
      start_date: dates[t.id].start_date,
      due_date: dates[t.id].due_date,
      instance_visibility_rules: {
        logic: t.visibility_logic,
        rules: visibilityRulesByTemplate[t.id] ?? [],
      },
      instance_dependencies: deps,
      blocks: blocksByTemplate[t.id] ?? [],
    };
  });
}

function resolveAssignment(
  t: TemplateInput,
  roleAssignments: Record<string, string>,
): string | null {
  if (t.assignment_mode === "user") return t.assigned_user_id;
  if (t.assignment_mode === "role" && t.assigned_role_id)
    return roleAssignments[t.assigned_role_id] ?? null;
  return null;
}

function evaluateVisibility(
  logic: string,
  rules: VisibilityRuleInput[],
  settingValues: Record<string, Json | null>,
): boolean {
  const active = rules.filter((r) => r.is_active);
  if (active.length === 0) return true;
  const results = active.map((r) => rulePasses(r, settingValues));
  return logic === "or" ? results.some(Boolean) : results.every(Boolean);
}

function rulePasses(
  rule: VisibilityRuleInput,
  settingValues: Record<string, Json | null>,
): boolean {
  const raw = settingValues[rule.setting_definition_id] ?? null;
  switch (rule.operator) {
    case "must_be_empty":
      return isEmpty(raw);
    case "must_not_be_empty":
      return !isEmpty(raw);
    case "must_contain":
      return coerceValue(raw).includes(coerceTarget(rule.target_value));
    case "must_not_contain":
      return !coerceValue(raw).includes(coerceTarget(rule.target_value));
    default:
      return true;
  }
}

// Matches v1: null / false / '' are "empty" (an empty array is NOT empty).
function isEmpty(v: Json | null): boolean {
  return v == null || v === false || v === "";
}

// Matches v1's coercion: booleans → yes/no; strings/numbers → their text;
// arrays/objects → '' (v1's `value_json #>> '{}'` yields null for containers).
function coerceValue(v: Json | null): string {
  if (v === true) return "yes";
  if (v === false) return "no";
  if (v == null) return "";
  if (typeof v === "string") return v.toLowerCase();
  if (typeof v === "number") return String(v).toLowerCase();
  return "";
}

function coerceTarget(t: string | null): string {
  if (t == null) return "";
  if (t === "true") return "yes";
  if (t === "false") return "no";
  return t.toLowerCase();
}

function addInterval(baseIso: string, days: number, hours: number): string {
  const d = new Date(baseIso);
  d.setTime(d.getTime() + days * 86_400_000 + hours * 3_600_000);
  return d.toISOString();
}
