import { describe, it, expect } from "vitest";
import {
  generateEpisodeTasks,
  type GenerateInput,
  type TemplateInput,
} from "./episode-generation";

const NOW = "2026-06-08T00:00:00.000Z";

function tmpl(over: Partial<TemplateInput> & { id: string }): TemplateInput {
  return {
    title: over.id,
    position: 0,
    assignment_mode: "none",
    assigned_role_id: null,
    assigned_user_id: null,
    visibility_logic: "and",
    ...over,
  };
}

function run(
  overrides: Partial<GenerateInput> & { templates: TemplateInput[] },
) {
  return generateEpisodeTasks({
    blocksByTemplate: {},
    visibilityRulesByTemplate: {},
    dependenciesByTemplate: {},
    dateRulesByTemplate: {},
    settingValues: {},
    roleAssignments: {},
    now: NOW,
    ...overrides,
  });
}

describe("visibility", () => {
  it("is visible when there are no rules", () => {
    const [t] = run({ templates: [tmpl({ id: "a" })] });
    expect(t.is_visible).toBe(true);
  });

  it("must_contain matches case-insensitively", () => {
    const [t] = run({
      templates: [tmpl({ id: "a" })],
      visibilityRulesByTemplate: {
        a: [
          {
            setting_definition_id: "s1",
            operator: "must_contain",
            target_value: "Video",
            is_active: true,
          },
        ],
      },
      settingValues: { s1: "we edit video" },
    });
    expect(t.is_visible).toBe(true);
  });

  it("coerces booleans to yes/no for contain", () => {
    const [yes] = run({
      templates: [tmpl({ id: "a" })],
      visibilityRulesByTemplate: {
        a: [
          {
            setting_definition_id: "s1",
            operator: "must_contain",
            target_value: "true",
            is_active: true,
          },
        ],
      },
      settingValues: { s1: true },
    });
    expect(yes.is_visible).toBe(true); // true→"yes", target "true"→"yes"

    const [no] = run({
      templates: [tmpl({ id: "a" })],
      visibilityRulesByTemplate: {
        a: [
          {
            setting_definition_id: "s1",
            operator: "must_contain",
            target_value: "true",
            is_active: true,
          },
        ],
      },
      settingValues: { s1: false },
    });
    expect(no.is_visible).toBe(false); // false→"no" does not contain "yes"
  });

  it("AND requires every active rule to pass; OR requires any", () => {
    const rules = {
      a: [
        {
          setting_definition_id: "s1",
          operator: "must_contain",
          target_value: "x",
          is_active: true,
        },
        {
          setting_definition_id: "s2",
          operator: "must_contain",
          target_value: "y",
          is_active: true,
        },
      ],
    };
    const values = { s1: "x", s2: "nope" }; // rule 1 passes, rule 2 fails

    const [andT] = run({
      templates: [tmpl({ id: "a", visibility_logic: "and" })],
      visibilityRulesByTemplate: rules,
      settingValues: values,
    });
    expect(andT.is_visible).toBe(false);

    const [orT] = run({
      templates: [tmpl({ id: "a", visibility_logic: "or" })],
      visibilityRulesByTemplate: rules,
      settingValues: values,
    });
    expect(orT.is_visible).toBe(true);
  });

  it("ignores inactive rules", () => {
    const [t] = run({
      templates: [tmpl({ id: "a" })],
      visibilityRulesByTemplate: {
        a: [
          {
            setting_definition_id: "s1",
            operator: "must_contain",
            target_value: "never",
            is_active: false,
          },
        ],
      },
      settingValues: { s1: "something" },
    });
    expect(t.is_visible).toBe(true); // only rule is inactive → no active rules → visible
  });

  it("must_be_empty / must_not_be_empty treat null/false/'' as empty", () => {
    const mk = (op: string, val: unknown) =>
      run({
        templates: [tmpl({ id: "a" })],
        visibilityRulesByTemplate: {
          a: [
            {
              setting_definition_id: "s1",
              operator: op,
              target_value: null,
              is_active: true,
            },
          ],
        },
        settingValues: { s1: val as never },
      })[0].is_visible;

    expect(mk("must_be_empty", null)).toBe(true);
    expect(mk("must_be_empty", "")).toBe(true);
    expect(mk("must_be_empty", false)).toBe(true);
    expect(mk("must_be_empty", "hi")).toBe(false);
    expect(mk("must_not_be_empty", "hi")).toBe(true);
    expect(mk("must_not_be_empty", null)).toBe(false);
  });
});

describe("status (dependencies)", () => {
  it("is open with no dependencies", () => {
    const [t] = run({ templates: [tmpl({ id: "a" })] });
    expect(t.status).toBe("open");
  });

  it("is blocked when it has a dependency on a VISIBLE prerequisite", () => {
    const tasks = run({
      templates: [tmpl({ id: "a", position: 0 }), tmpl({ id: "b", position: 1 })],
      dependenciesByTemplate: { b: ["a"] },
    });
    expect(tasks.find((t) => t.task_template_id === "b")!.status).toBe(
      "blocked",
    );
  });

  it("is blocked even when its prerequisite is HIDDEN (no auto-satisfy)", () => {
    const tasks = run({
      templates: [tmpl({ id: "a", position: 0 }), tmpl({ id: "b", position: 1 })],
      // a is hidden by an unsatisfiable rule
      visibilityRulesByTemplate: {
        a: [
          {
            setting_definition_id: "s1",
            operator: "must_be_empty",
            target_value: null,
            is_active: true,
          },
        ],
      },
      settingValues: { s1: "not empty" },
      dependenciesByTemplate: { b: ["a"] },
    });
    const a = tasks.find((t) => t.task_template_id === "a")!;
    const b = tasks.find((t) => t.task_template_id === "b")!;
    expect(a.is_visible).toBe(false);
    expect(b.is_visible).toBe(true);
    expect(b.status).toBe("blocked"); // hidden prereq still blocks
  });
});

describe("dates", () => {
  it("computes episode_start-relative dates as now + offset", () => {
    const [t] = run({
      templates: [tmpl({ id: "a" })],
      dateRulesByTemplate: {
        a: [
          {
            date_field: "due_date",
            relative_to: "episode_start",
            relative_task_template_id: null,
            offset_days: 3,
            offset_hours: 0,
          },
        ],
      },
    });
    expect(t.due_date).toBe("2026-06-11T00:00:00.000Z");
    expect(t.start_date).toBeNull();
  });

  it("computes task-relative dates from the anchor's pass-1 date", () => {
    const tasks = run({
      templates: [tmpl({ id: "a", position: 0 }), tmpl({ id: "b", position: 1 })],
      dateRulesByTemplate: {
        a: [
          {
            date_field: "due_date",
            relative_to: "episode_start",
            relative_task_template_id: null,
            offset_days: 2,
            offset_hours: 0,
          },
        ],
        b: [
          {
            date_field: "start_date",
            relative_to: "task_due",
            relative_task_template_id: "a",
            offset_days: 1,
            offset_hours: 0,
          },
        ],
      },
    });
    const b = tasks.find((t) => t.task_template_id === "b")!;
    expect(b.start_date).toBe("2026-06-11T00:00:00.000Z"); // (now+2d)+1d
  });

  it("leaves a task-relative date null when the anchor has no date", () => {
    const tasks = run({
      templates: [tmpl({ id: "a", position: 0 }), tmpl({ id: "b", position: 1 })],
      dateRulesByTemplate: {
        // a has no date rule → no due_date
        b: [
          {
            date_field: "start_date",
            relative_to: "task_due",
            relative_task_template_id: "a",
            offset_days: 1,
            offset_hours: 0,
          },
        ],
      },
    });
    expect(tasks.find((t) => t.task_template_id === "b")!.start_date).toBeNull();
  });
});

describe("assignment", () => {
  it("uses the template user for user mode", () => {
    const [t] = run({
      templates: [
        tmpl({ id: "a", assignment_mode: "user", assigned_user_id: "u1" }),
      ],
    });
    expect(t.assigned_user_id).toBe("u1");
  });

  it("resolves role mode via the show's role assignments", () => {
    const [t] = run({
      templates: [
        tmpl({ id: "a", assignment_mode: "role", assigned_role_id: "r1" }),
      ],
      roleAssignments: { r1: "u9" },
    });
    expect(t.assigned_user_id).toBe("u9");
  });

  it("is null for role mode with no assignment, and for none mode", () => {
    const [roleNoAssign] = run({
      templates: [
        tmpl({ id: "a", assignment_mode: "role", assigned_role_id: "r1" }),
      ],
      roleAssignments: {},
    });
    expect(roleNoAssign.assigned_user_id).toBeNull();

    const [none] = run({ templates: [tmpl({ id: "b", assignment_mode: "none" })] });
    expect(none.assigned_user_id).toBeNull();
  });
});

describe("snapshots & shape", () => {
  it("snapshots dependencies, visibility rules, and blocks; sorts by position", () => {
    const tasks = run({
      templates: [
        tmpl({ id: "b", position: 1, visibility_logic: "or" }),
        tmpl({ id: "a", position: 0 }),
      ],
      dependenciesByTemplate: { b: ["a"] },
      visibilityRulesByTemplate: {
        b: [
          {
            setting_definition_id: "s1",
            operator: "must_contain",
            target_value: "x",
            is_active: true,
          },
        ],
      },
      blocksByTemplate: {
        a: [
          {
            block_type: "text_input",
            label: "Notes",
            required: false,
            options_json: null,
            display_order: 0,
          },
        ],
      },
    });
    // sorted by position: a (0) then b (1)
    expect(tasks.map((t) => t.task_template_id)).toEqual(["a", "b"]);
    const b = tasks[1];
    expect(b.instance_dependencies).toEqual(["a"]);
    expect(b.instance_visibility_rules.logic).toBe("or");
    expect(b.instance_visibility_rules.rules).toHaveLength(1);
    expect(tasks[0].blocks).toHaveLength(1);
  });
});
