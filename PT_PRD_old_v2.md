# ProcessTool — PRD v3 (Vite + TanStack Rebuild)

**Status:** Build-ready
**Stack:** Vite + TanStack Router + TanStack Query + TypeScript + Supabase + Tailwind v4 + Brian Casel's `bm-design-system`
**Reuses:** The existing Supabase project (database, schema, auth, storage, all test data) from the v1 build — unchanged.

**Repo:** `~/projects/processtool` (this v2/v3 build).
**v1 reference:** `~/projects/starflight` — the original working build. Claude Code reads it as a *behavioral reference* (how features work), not code to copy. v1 is Next.js/server-first; its logic is re-expressed in the new SPA stack, never pasted in. v1 does not need to compile or run to serve as a reference. Reference it from the logic-heavy phases onward (Phases 4–5 and later); the early scaffold phases don't need it.

> **v3 note:** This revision corrects and expands the rule model (visibility + dependencies unified), promotes **tags** to a first-class entity, fixes the episode-generation visibility model to support post-creation tagging, and re-sequences the phases around episode generation. See the changelog at the bottom.

---

## 0. Read This First

This is a **rebuild**, not a new product. A complete, working v1 of ProcessTool already exists (built on Next.js App Router). Every feature, behavior, and data structure described here was validated in v1. The discovery work is done. This document is the source of truth; the v1 codebase is the reference implementation.

**What changes in v2/v3:**
- Frontend rebuilt as a true client-side SPA on Vite + TanStack Router.
- Data layer uses TanStack Query for caching, prefetching, and optimistic updates — this is what makes the app feel instantaneous.
- The entire visual layer comes from `bm-design-system`, installed on day one. We are abandoning *all* v1 styling.

**What does NOT change:**
- The Supabase project. Same database, same schema, same RLS, same auth, same storage buckets, same test data. We point the new app at the existing project.
- The data model, business logic, and interaction behaviors. These are re-expressed in the new stack, not redesigned. (v3 formalizes tag and rule behavior that already existed in v1 but was under-specified in earlier drafts.)

**Critical build discipline (carried from v1, non-negotiable):**
- **One concern per Claude Code prompt.** Large combined prompts cause dropped work.
- **Each phase is its own git branch**, merged to `main` only after visual verification in the browser.
- **Commit after each successful step.**
- **Every phase prompt states explicitly what NOT to build yet.**
- **No auto-save anywhere.** Nothing persists until the user clicks Update/Save.
- When Claude Code drifts, re-orient it: "Read CLAUDE.md and PRD.md."

---

## 1. The Design System Is Foundational

`bm-design-system` is not a coat of paint applied at the end. It is the substrate every screen is built on, from Phase 1 forward. This is the single biggest lesson from v1: the styling was deferred to a final phase (Phase 16) and that phase is what stalled the entire project for months.

**Rules for the whole build:**
1. The design system is installed and verified **before any feature work** (Phase 1).
2. Every UI element in every later phase is composed from design-system primitives and components. **No ad-hoc styling. No one-off components.** If something needed isn't in the system, the move is to *add it to the system* (and document it on the reference page), not to hand-roll it in a feature.
3. The design system's `AGENTS.md` / `CLAUDE.md` managed block stays in place so Claude Code always defers to the system. Do not strip or override it.
4. The design-system reference page (`/admin/design-system` or equivalent) stays in the app as living documentation throughout the build.

**Functional/structural elements that ship with the design system and are KEPT AS-IS** (do not rebuild, restyle, or reinvent these — adopt their behavior directly):
- Collapsible sidebar (click-to-toggle full-width ↔ icon-collapsed)
- App shell / page shell layout (dark shell, light inset content area)
- Top bar with search trigger and user menu
- Light/dark mode toggle (persists to localStorage)
- Page headers, navigation (main + sub), footers
- Button variants, button dropdowns, toggle buttons
- Forms, inputs, selects, radios
- Badges
- Data table
- Modal / dialog
- Rich text field
- Iconography conventions
- Typography scale and semantic color tokens (page, surface, ink, accent, signal, hairline, etc.)

The app's chrome (sidebar, shell, header, nav, theming) **is** the design system's chrome. ProcessTool-specific work is the *content* that lives inside that chrome.

---

## 2. Core Domain Model (unchanged from v1)

### Hierarchy
**Workflow → Process → Tasks**

- A **Workflow** is a show-level container that holds a single **Process**.
- A **Process** is a reusable task template containing tasks, with conditionals based on show attributes (and other rule inputs — see Section 5A).
- Applying a Process to a new episode **generates a live task list** (an instance) — a one-time stamp at creation. Editing the template later does not retroactively change existing episodes.

### Key interaction patterns to preserve (verbatim from v1)
1. **Template-first architecture:** build the process once, stamp out episodes repeatedly.
2. **Show-driven conditionality:** a show's attribute answers change which tasks appear automatically.
3. **Tag-driven conditionality:** tags applied to an episode *after* creation change which tasks appear (the episode-type workflow — see Section 5A and 5B).
4. **Role abstraction:** templates stay generic ("Video Editor"); shows personalize the assignment (e.g. "Video Editor = JP").
5. **Visibility vs. dependencies:** visibility determines whether a task *exists for this episode at all* (hidden = invisible in every way). Dependencies determine whether an existing, visible task is *available yet* (blocked = greyed/disabled). One hides; the other gates. **Both are evaluated by the same rule engine (Section 5A); they differ only in consequence.**
6. **Mixed operational and data-entry tasks:** a task can be both "do this work" and "fill out this form."
7. **Embedded communication:** email tasks tie client communication to operational completion.
8. **Date cascading:** setting a date on one task ripples through dependent tasks automatically (live, on the instance — Phase 8).
9. **Explicit save:** nothing persists until the user clicks Update/Save.
10. **Instance edits are one-offs:** changes inside an episode never propagate back to the process or other episodes.

### Primary entities (existing tables — confirm against live schema)
- `organizations` / shows and their attribute answers
- `workflows`
- `processes`
- `tasks` (template tasks)
- `task_blocks` (blocks on template tasks)
- `episodes` (process instances)
- `task_instances` (generated live tasks)
- `task_instance_blocks` (blocks on live tasks; supports one-off edits)
- `people` / `users` and role assignments
- `notification_preferences`
- rule tables (visibility + dependency rules; see Section 5A for the unified model)
- **tags + episode_tags** (first-class in v3 — confirm/extend against live schema; see Section 5C)
- Supabase Auth tables + invite token handling
- Storage buckets for file-attachment blocks

> The schema is already in Supabase. Phase 2 reconciles the app's types against the live schema rather than recreating tables. **Tag tables may need to be added/confirmed** — see Section 5C.

---

## 3. Block Types (unchanged from v1)

Tasks (template and instance) are composed of blocks. Supported block types:
- Text / rich text (rich text field from design system)
- Checklist
- Form fields (data entry)
- Email (template + send-on-complete)
- File attachment (Supabase Storage)
- (Confirm full list against v1 implementation during Phase 5.)

---

## 4. Roles & Access (unchanged from v1)

- **Admin users** see the full sidebar (Dashboard, Workflows, Shows, Processes, People, **Tags**).
- **Regular users** see only the Dashboard.
- Access is enforced by Supabase RLS (see Section 7) **and** reflected in client-side route guards. In a SPA, RLS is the real security boundary — route guards are UX, not security.

---

## 5. SPA Architecture Principles (new in v2)

These principles are what deliver the "instantaneous" feel. They apply across all feature phases.

1. **TanStack Router** owns all routing: type-safe routes, nested layouts (the shell never re-renders on navigation), search-param state for deep-linkable filters/tabs, and route loaders.
2. **TanStack Query** owns all server state:
   - Every Supabase read goes through a query with a sensible `staleTime` so revisited data shows instantly from cache while refetching in the background.
   - **Prefetch on hover/intent** for list → detail navigation (hovering a workflow row prefetches that workflow).
   - **Optimistic updates** for mutations where it improves perceived speed (task status toggles, reorders, inline edits) — update the cache immediately, reconcile on server response, roll back on error.
3. **Supabase client** talks directly from the browser (anon key + RLS). No server-side API layer.
4. **Supabase Realtime** subscriptions update the relevant query caches live.
5. **Explicit-save** maps cleanly to client draft state: hold edits in local component/form state, commit via a mutation on Save. Do not auto-persist.
6. **Deep linking:** SPA needs a host rewrite rule so direct URLs resolve to the app (see Phase 1 / deployment).

---

## 5A. The Unified Rule Engine (formalized in v3)

**Visibility rules and dependency rules share one evaluation engine.** They are configured the same way, evaluated the same way, and differ *only* in what happens when the rule set's result is "false":

- **Visibility rule fails →** the task is **hidden** (does not exist for this episode in any visible way).
- **Dependency rule fails →** the task is **blocked** (visible but greyed/disabled until the rule is satisfied).

A task can have *both* a visibility rule set and a dependency rule set. They are independent: visibility decides existence; dependency decides availability of an existing task.

### Rule inputs (the four types — identical for visibility and dependencies)

1. **Task completion** — another task being complete.
   - Operator: complete / not complete.
   - *(Already works in v1 for dependencies; now also available to visibility.)*
2. **Show settings value** — a show attribute answer.
   - Operators: must contain / must not contain / must not be empty / must be empty.
   - If "must contain" or "must not contain": a value field appears to set what's checked against.
   - *(Already built for visibility; now also available to dependencies.)*
3. **Episode tag** — presence/absence of a tag on the episode (see Section 5C).
   - Operator: must be present / must not be present.
   - Select the tag from the managed tag list.
4. **Task field value** — a block/field response on another task.
   - Flow: pick a task → pick a block/field within that task → pick an operator (must contain / must not contain / must not be empty / must be empty). If "must contain" / "must not contain": a value field appears to set what's checked against.

### Combining rules

- A task's rule set (visibility or dependency) can hold multiple rules with an **AND / OR toggle** (same control for both rule kinds).
  - AND = the set passes only if every rule passes.
  - OR = the set passes if any rule passes.
- No rules = passes by default (task is visible / unblocked).

### Evaluation timing & edge cases

- Rules are **evaluated live** against the episode's current state — show settings, current tags, current task-field responses, and current task completions. This is what makes the tag-driven episode-type workflow work (add a tag → tasks appear/disappear).
- **Hidden-task references:** if a rule (visibility or dependency) references a task that is itself currently **hidden** by visibility, treat that hidden task's completion as *not complete* and its field values as *empty/unsatisfied*. A hidden task contributes nothing truthy to another task's rules.
- **Date rules** on a task that becomes visible later (e.g. after a tag is added) follow the **same "compute when an anchor exists"** path as all other date rules (Section 5D) — there is no special "mini-generation" recompute on visibility change.

---

## 5B. Visibility & Generation Model (corrected in v3)

The earlier draft implied "resolve visibility once at generation; excluded tasks are never created." **That is wrong for this app** because it cannot support the validated v1 workflow where a user adds a tag to an episode *after* creation and the visible task set changes in response.

**Correct model:**

- At episode creation, generate a `task_instance` row for **every** task template in the process (not only the qualifying ones). Each instance snapshots its blocks and copies its rules (visibility, dependency, date).
- **Visibility is evaluated live**, per Section 5A, against the episode's current state.
- The episode task list **renders only tasks that currently pass visibility.** Tasks that fail visibility are hidden rows — invisible in every way to the user, but present in the data so that (a) adding/removing tags or changing inputs can reveal them, and (b) rules referencing them can always resolve by name.

This satisfies the user-facing requirement (only qualifying tasks are ever shown; non-qualifying tasks are invisible) **and** supports post-creation tag-driven visibility. The "materialize all rows, render the visible subset" approach is the implementation detail; the user only ever sees the currently-qualifying tasks.

### Generation trigger (v3 decision: **auto only**)

- Creating an episode in a workflow **auto-generates** its task instances from the workflow's assigned process.
- If the workflow has **no assigned process**, the episode is created empty, and a manual **"Add Task"** affordance lets the user create individual task instances by hand. (Rarely used — it largely defeats the template-first purpose — but the capability must exist as a safety valve.)
- **No "regenerate" action.** This matches v1 (generate once) and honors the independence principle: template changes never propagate to existing episodes. (Note: live visibility re-evaluation is *not* regeneration — it re-renders the already-materialized rows against current state; it never re-reads the template.)

### Dangling / blocked dependencies

- Because every task is materialized (even hidden ones), a dependency always has a real target row to name — there are no truly "dangling" edges.
- If a task is blocked by a dependency whose target is hidden (treated as not-complete/empty per 5A), the task stays **blocked**. This is intentional and surfaces a process-design issue (a task depending on something that doesn't qualify for this episode) loudly rather than silently.
- **Resolution path (Phase 8 requirement):** the instance-level dependency editor must be able to **display and remove** a dependency whose target task is currently hidden. The user opens the blocked task, sees the offending dependency named, and removes it to unblock — a one-off instance edit that does not propagate back.
- **Optional, recommended:** at generation, if a visible task is blocked by a dependency on a hidden task, surface a non-fatal toast/notice (e.g. "Task B depends on Task A, which isn't included for this episode — B will be blocked"). Turns a silent diagnostic into an explicit one.

---

## 5C. Tags (first-class entity — new in v3)

Tags were referenced in v1 (an "add tag on completion" action existed) but were never fully specified. v3 promotes tags to a managed, first-class entity.

**What tags are:**
- A globally-managed list with their own **top-level nav item** (`Tags`) and a CRUD screen (create/edit/delete tags). Tags are referenced across many processes, so they are global, not a child of any one workflow.
- Applied to **episodes only** — never to processes or workflows. An episode can carry multiple tags, added and removed *after* creation.

**How tags are used:**
- **As a completion action:** "on task completion, add tag X to this episode" (wire up the existing-but-incomplete "add tag" action so it attaches a chosen tag from the managed list). Consider also supporting "remove tag X on completion" for symmetry if v1 had it — confirm against v1.
- **As a rule input:** both visibility and dependency rules can test tag presence/absence (Section 5A, input type 3). This is the mechanism behind the episode-type workflow.

**The validated episode-type workflow (the reason tags exist):**
> A show produces three episode types, each needing a slightly different task set. Create a tag per episode type. In that show's process, set conditional tasks whose **visibility** keys off the presence of a specific tag. On creating an episode for that show, add the tag for whichever type it is; the visible task set updates to that episode type's tasks.

**Data model (confirm/extend against live schema in Phase 2):**
- `tags` — id, label, (optional) color/category. Globally scoped.
- `episode_tags` — join table: episode_id ↔ tag_id.
- Completion-action storage must be able to reference a `tag_id`.

---

## 5D. Date Rules & Cascading (clarified in v3)

The date model is unchanged from v1 behavior; v3 just states it precisely and assigns the cascade to Phase 8.

- A date rule is a **relationship**, copied onto the task instance at generation: a target field (start or due) computed relative to an **anchor** (another task's start/due date, or the episode-creation date) plus a day/hour offset.
- **At generation (Phase 7):** compute the dates that *can* be computed:
  - Anchored to **episode-creation date** → compute immediately (creation timestamp + offset).
  - Anchored to **another task** → compute only if that task already has the needed date; otherwise leave **null**.
- **A null date is filled later by the cascade**, not by re-reading the template.
- **Cascade (Phase 8):** when a user sets/updates a date on an instance task, find all instance tasks whose date rules reference it, recompute them, and recurse (with visited-tracking to prevent loops). Show a toast: "Updated dates for N dependent tasks." Manual date edits are preserved as one-offs.
- Tasks that become visible later (via a tag) use this same path — no special recompute on visibility change.

---

## 6. Build Phases

Each phase = one branch = one (or a few tightly-scoped) Claude Code prompt(s). Verify in browser, commit, merge, move on. Phases are ordered by dependency. **Do not jump ahead.** Auth comes after the core app works (validated lesson from v1 — avoids fighting login redirects during development).

> Phase prompts below are summaries of intent and scope, including explicit "do NOT build yet" boundaries. Full per-phase prompts can be generated one at a time when you reach each phase.

> **v3 re-sequencing note:** Episode generation grew into a cluster (generation + tags + the unified rule engine). **Phases 1–6 are complete and merged; their text is left exactly as built and is not modified by v3.** The new work is inserted as **7, 7.5, 7.6, 7.7**. Because Phase 5 (merged) authored only show-attribute conditionals and basic task-completion dependencies, the expanded four-input rule engine is *authored* in the new Phase 7.6 (template side) and *evaluated* in Phase 7.7 (instance side), rather than retroactively rewritten into Phase 5. Phase 8 inherits two new requirements (orphan-dependency display; completion-triggered rule re-evaluation). Phases 8–16 keep their numbers.

### Phase 1 — Project scaffold + design system foundation
**Branch:** `phase-1/scaffold-design-system`
- Scaffold Vite + React + TypeScript + TanStack Router + Tailwind v4.
- Install and wire `bm-design-system`. Verify the reference page renders, light/dark toggle works, collapsible sidebar works, app shell renders.
- Establish the app shell as the root layout (sidebar + top bar + light inset content area) using the design system's shell — this is the frame every route renders into.
- Configure ESLint/Prettier.
- Add the SPA deep-link rewrite config for the host (e.g. `vercel.json` rewrite of all routes to index).
- **Do NOT build:** any ProcessTool features, any data wiring, any Supabase connection yet. This phase is purely the styled, navigable empty shell.

### Phase 2 — Supabase connection + schema reconciliation + typed data layer
**Branch:** `phase-2/supabase-data-layer`
- Connect to the **existing** Supabase project via env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Generate TypeScript types from the live schema (`supabase gen types`).
- Set up the Supabase browser client and the TanStack Query provider.
- Establish query/mutation conventions (query keys, staleTime defaults, prefetch helper, optimistic-update helper).
- Build a couple of trivial read-only queries against real test data to confirm the pipe works end to end (e.g. list shows, list workflows) — rendered with design-system table/list components.
- **Do NOT build:** auth, writes, or full feature pages yet. Read-only smoke test only.

### Phase 3 — Read-only core surfaces (lists + detail shells)
**Branch:** `phase-3/read-surfaces`
- Dashboard, Workflows, Shows, Processes, People list pages — read-only, real data, design-system components, with prefetch-on-hover into detail routes.
- Detail route shells for Workflow, Process, Show, Person, Episode (data displayed, not yet editable).
- Page headers via the design system's page-header pattern; action buttons live in the page header (validated v1 lesson), even if non-functional placeholders for now.
- **Do NOT build:** any create/edit/delete, the process builder interactions, or auth.

### Phase 4 — Shows & People CRUD + role assignment
**Branch:** `phase-4/shows-people-crud`
- Create/edit/delete shows (orgs) including their attribute answers (the conditionality inputs).
- Create/edit/delete people; assign roles at the show level (role abstraction pattern).
- Optimistic updates on mutations; explicit-save dialogs/forms from the design system.
- **Do NOT build:** the process builder, episodes, or conditional task generation yet.

### Phase 5 — Process builder (the heavyweight)
**Branch:** `phase-5/process-builder`
- The vertical-card process builder with inline tabs.
- Block editor: add/edit/delete blocks on template tasks; all block types.
- Conditional rules on tasks (based on show attributes).
- Task dependencies and the date-cascading model (template-level definition).
- Explicit-save throughout.
- **Split if needed:** if too large in one prompt, do (a) block editor first, then (b) builder card UI + conditionals + dependencies. Decide at the phase.
- **Do NOT build:** drag-and-drop yet; episode instances yet.

### Phase 6 — Drag & drop + duplicate-from-existing
**Branch:** `phase-6/dnd-duplicate`
- dnd-kit reordering for tasks and blocks in the process builder.
- Duplicate-from-existing via command palette.
- (Isolated deliberately — dnd-kit caused friction in v1 and shouldn't block core editing.)
- **Do NOT build:** episode-side editing yet.

### Phase 7 — Episode generation (the core stamp)
**Branch:** `phase-7/episode-generation`
- On episode create in a workflow, **auto-generate** the live task list (`task_instances` + `task_instance_blocks`) from the workflow's assigned process. No assigned process → empty episode + manual "Add Task" affordance.
- **Materialize a row for every task template** (Section 5B), copying each task's blocks and its rules (visibility, dependency, date).
- **Evaluate show-settings-based visibility live** (the conditional model already shipped in Phase 5) and render only the currently-qualifying tasks. Hidden tasks are present in data, invisible in UI.
- Compute the dates that can be computed at creation (episode-creation-anchored, plus any chain that resolves immediately); leave the rest null (Section 5D). **No cascade here** — that's Phase 8.
- Treat the generation logic as a **pure, unit-testable function** apart from the DB where possible. This is the most complex system behavior — treat it carefully; verify generated instances against v1 behavior.
- **Scope note:** Phase 7 handles **show-settings** visibility only, since that is what Phase 5 authored. The unified four-input rule engine (adding episode-tag and task-field-value inputs) is authored in Phase 7.6 and evaluated live in Phase 7.7.
- **Do NOT build:** tags entity, the expanded rule inputs, instance editing, task completion, or the date cascade yet.

### Phase 7.5 — Tags as a first-class entity
**Branch:** `phase-7-5/tags`
- Add/confirm `tags` + `episode_tags` schema (Section 5C).
- **Tags top-level nav item** + CRUD screen (create/edit/delete tags), built from design-system primitives.
- **Episode-level tag management:** add/remove tags on an episode instance (not on processes or workflows).
- Wire the **"add tag on completion" action** so completing a task actually attaches the chosen tag to the episode. (Confirm whether v1 also supported "remove tag on completion"; add if so.)
- Self-contained and testable: create tags, add them to an episode, fire the action — without touching the rule engine yet.
- **Do NOT build:** rule authoring or evaluation that uses tags yet (that's 7.6/7.7); tag-based reporting/filtering beyond what's needed here.

### Phase 7.6 — Unified rule authoring (template side)
**Branch:** `phase-7-6/rule-engine-authoring`
- Phase 5 (merged) authored only show-attribute conditionals and basic task-completion dependencies. This phase extends the **process builder's** Visibility and Dependencies tabs into the **shared four-input rule editor** (Section 5A): task completion, show settings value, episode tag, task field value — with shared operators and the AND/OR toggle. Build the rule editor once and reuse it for both tabs; they differ only in consequence (hide vs. block).
- The **episode-tag** input draws from the tag list shipped in 7.5. The **task-field-value** input flow: pick a task → pick a block/field → operator → conditional value field.
- This is **authoring only** — defining and saving rules on task templates. Live evaluation against an episode is Phase 7.7.
- Migrate/extend the existing rule storage so the new input types persist alongside what Phase 5 already saved. Confirm existing Phase 5 rules still load and evaluate unchanged.
- **Do NOT build:** instance-side live evaluation (7.7); the date cascade or instance editing (Phase 8).

### Phase 7.7 — Unified instance-side rule evaluation (live)
**Branch:** `phase-7-7/rule-engine-instance`
- Wire the **live, unified rule engine on the instance side** (Section 5A) so visibility and dependencies both evaluate against the episode's current state: show settings, **current tags**, **task field values**, and task completions.
- This brings the **tag-driven episode-type workflow** online: adding/removing a tag re-renders the visible task set; the **task-field-value** input type evaluates against live block responses.
- Apply the hidden-task reference rule (hidden task = not-complete / empty per 5A) and the AND/OR combination semantics.
- Optional generation-time blocked-dependency notice (Section 5B).
- **Do NOT build:** the date cascade or instance block editing (Phase 8); email sending (Phase 12).

### Phase 8 — Episode task list: completion, status, instance editing
**Branch:** `phase-8/episode-editing`
- Task status (open / blocked / completed); blocked tasks rendered disabled (blocking comes from the live dependency engine in 7.7).
- **Live date cascading** on the instance (Section 5D): setting a date ripples to dependents, recurses with visited-tracking, toasts the count.
- One-off block editing on instance tasks (add/edit/delete blocks — does not propagate back).
- **Orphan/hidden-dependency display (Section 5B):** the instance dependency editor must display and allow removing a dependency whose target task is currently hidden, so a user can unblock a task whose predecessor doesn't qualify for this episode.
- **Completion-triggered re-evaluation:** completing a task re-evaluates any visibility/dependency rules that reference it (and fires any completion actions, including add-tag, which itself can change visibility).
- Drag-and-drop on the instance (reuse Phase 6 patterns).
- Optimistic updates for status toggles (high-frequency interaction — make it feel instant).
- **Do NOT build:** email sending, notifications, or auth yet.

### Phase 9 — Command palette (Cmd+K) + global search
**Branch:** `phase-9/command-palette`
- Cmd+K palette with debounced search across episodes, shows, tasks, people, workflows, processes, **tags** (trigram indexes already exist in Supabase).
- Design-system modal/command primitives.
- **Do NOT build:** auth or email yet.

### Phase 10 — File attachments + Supabase Storage
**Branch:** `phase-10/file-attachments`
- File-attachment block type wired to the existing Storage buckets.
- Upload/download/delete with the design system's file UI.
- Watch for the storage-bucket quirks hit in v1 (see Section 8) — bake the fix in.
- **Do NOT build:** auth or email yet.

### Phase 11 — Auth, invites, user linking, RLS enforcement
**Branch:** `phase-11/auth`
- Supabase Auth login/logout; client-side route guards (admin vs regular sidebar).
- **Invite flow:** invite email routes via `token_hash` through `/auth/callback` — NOT the default `ConfirmationURL`. (This was the single biggest v1 auth gotcha; bake it in from the start.)
- User linking (invited person → real auth user).
- Verify every RLS policy actually protects client-direct access (see Section 7) — **including the new `tags` / `episode_tags` tables.**
- **This is the most important phase to get right** — everything downstream assumes a real authenticated user. Test the invite flow thoroughly.
- **Do NOT build:** notifications/email-sending features yet (auth emails only here).

### Phase 12 — Email sending + notifications + preferences
**Branch:** `phase-12/notifications-email`
- Resend integration via `send.podcastroyale.net` (domain already verified). Email utility wrapping Resend.
- Replace any placeholder/logged emails with real sends; graceful failure (error toast, don't block task completion).
- Notification triggers: task assigned, task starting, task due, @mention in comment — each creates an in-app notification and (preference-permitting) sends email.
- Scheduled checks for starting/due (Supabase Edge Function cron, every ~15 min) using a `notifications_sent` jsonb tracking pattern.
- `notification_preferences` table (already exists) + settings page in the user menu.
- **Do NOT build:** anything beyond notifications here.

### Phase 13 — Realtime
**Branch:** `phase-13/realtime`
- Supabase Realtime subscriptions feeding TanStack Query cache updates (live task status, new notifications, collaborative episode views).
- **Do NOT build:** new features — this wires liveness into existing surfaces.

### Phase 14 — Polish, empty states, loading/skeleton states, error states
**Branch:** `phase-14/polish`
- Design-system skeletons for query loading; empty states for every list; error boundaries; toast consistency (Sonner or design-system equivalent).
- Keyboard/focus/accessibility pass on dialogs and the command palette.
- Running parking-lot items: role-deletion reference list (show which shows/processes reference a role, not silent cascade); IANA timezone dropdown; block add/save pattern decision; residual task-card drop text-flash.
- **Do NOT build:** new features.

### Phase 15 — Full QA pass against v1 parity
**Branch:** `phase-15/qa-parity`
- Walk every feature against the v1 reference implementation and this PRD. Confirm behavior parity, especially: **unified rule evaluation (visibility + dependencies, all four inputs), tag-driven episode-type workflow,** conditional generation, date cascading, instance one-off edits, invite flow.
- Fix regressions; no new scope.

### Phase 16 — Deploy + cutover
**Branch:** `phase-16/deploy`
- Deploy to Vercel (same project conventions). Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- Confirm SPA deep-link rewrite in production.
- Custom domain. Smoke test with real auth + real (test) data.
- Merge to `main`. Start using it.

> The weight is concentrated in Phases 7 / 7.5 / 7.6 / 7.7 (generation, tags, rule authoring, instance-side rule evaluation), Phase 11 (auth), and Phase 12 (notifications) — the same places that were heavy in v1, plus the tag/rule work that v1 had but earlier drafts under-specified. (Phase 5, the builder, was also heavy but is complete and merged.) The phase that broke v1 (the UI/design pass) no longer exists as a phase; it's Phase 1 and it's woven through everything.

---

## 7. Supabase RLS — What To Verify Before Building (CRITICAL for the SPA)

In v1 (server-capable Next), some logic may have run server-side, so RLS could have been more permissive than is safe for a pure SPA. In v2/v3 the browser talks **directly** to Supabase with the anon key, so **RLS is the entire security boundary.** Verify the following in the Supabase dashboard (Authentication → Policies, and SQL editor) before Phase 4.

### Checklist
1. **RLS is ENABLED on every table** that holds real data. Any table with RLS disabled is world-readable/writable via the anon key. Run:
   ```sql
   select schemaname, tablename, rowsecurity
   from pg_tables
   where schemaname = 'public'
   order by tablename;
   ```
   Every app table should show `rowsecurity = true` — **including `tags` and `episode_tags` once added.**

2. **Every table has explicit policies** for the operations the app performs (select/insert/update/delete). With RLS on and no policy, access is denied (safe but the app breaks); with RLS off, access is wide open (unsafe). You want RLS on + correct policies. List them:
   ```sql
   select tablename, policyname, cmd, qual, with_check
   from pg_policies
   where schemaname = 'public'
   order by tablename, cmd;
   ```

3. **Policies key off the authenticated user, not a trusted server.** Each policy's `USING` / `WITH CHECK` should reference `auth.uid()` (or a membership lookup from it). If any policy is effectively `true` for `anon` or relies on "the server already checked," it must be tightened.

4. **No service-role key in the client.** The SPA uses only the anon key. The service-role key (which bypasses RLS) must never ship to the browser — it stays server-side (Edge Functions / cron only).

5. **Storage bucket policies** mirror table policies: only authorized users can read/write objects in the file-attachment buckets. Check Storage → Policies.

6. **Auth/invite tables** behave correctly under RLS for the invite + linking flow (Phase 11 depends on this).

### How to act on it
- If policies are already `auth.uid()`-based and strict (likely, if v1 followed Supabase conventions): you're good — just confirm.
- If any table has RLS off or an overly-permissive policy: tighten it **before** Phase 4 wiring, since the SPA will lean on it for real.
- Don't change the schema or data — this is a policy review, not a migration. **(Exception: the tag tables in Section 5C are a deliberate, confirmed addition handled in Phase 2/7.5.)**

### ON DELETE CASCADE awareness (carried from v1)
- The FK on `episodes → shows` means deleting a show in the Supabase dashboard bypasses app-level guards and cascade-deletes episodes. The app-level guard is the sole protection — a permanent risk to stay aware of. Apply the same defense-in-depth on `episodes → task_instances` and on tag joins.

---

## 8. Known v1 Bugs To Bake In As Spec (don't rediscover)

| Issue (v1) | Resolution to encode up front | Carries to v2/v3? |
|---|---|---|
| Invite email used default `ConfirmationURL`, broke linking | Route invite via `token_hash` through `/auth/callback` | Yes (Supabase-level) — Phase 11 |
| Hash-based deep linking fragile | Use TanStack Router routes + host rewrite rule | Replaced by SPA routing — Phase 1 |
| Storage bucket quirks during upload | Confirm bucket policies + path conventions before wiring | Yes — Phase 10 |
| dnd-kit integration friction / render storm | Isolate in its own phase; split `SortableTaskRow` + memoized `TaskCard` + DragOverlay | Yes — Phase 6 |
| Scheduled notifications fired twice / untracked | `notifications_sent` jsonb per task; check before send | Yes — Phase 12 |
| Large combined prompts dropped work | One concern per prompt; explicit "do NOT build" | Process — all phases |
| Tag/rule behavior under-specified in early v2 drafts | Unified rule engine + first-class tags formalized | Fixed in v3 — Phases 7.5, 7.6, 7.7 |

**Will NOT carry over** (Next-specific, simply absent in the SPA): server-action edge cases, App Router routing quirks, the middleware/proxy deprecation warning, RSC hydration mismatches.
**New, smaller set to watch:** SPA deep-link rewrite, client-side route guards, ensuring RLS is airtight (Section 7), TanStack Query cache-invalidation correctness after mutations, **correct re-render of the visible task set when tags/inputs change (the live rule engine).**

---

## 9. Reusing Existing Supabase Data

The v2/v3 app points at the **same Supabase project** as v1. All test podcasts, test users, test workflows, rules, and dependencies created during v1 testing remain and are reused — no re-entry. Concretely:
- Same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (the v1 `NEXT_PUBLIC_*` values).
- Same schema → generate types from it (Phase 2).
- Same auth users and invite state.
- Same storage buckets and objects.
- **Tags:** confirm existing tag data/schema; extend per Section 5C if needed.
The only pre-work is the RLS review in Section 7.

---

## 10. CLAUDE.md (paste into project root)

> Keep this short; it orients Claude Code every session. The design-system plugin also maintains its own managed block in CLAUDE.md — do not remove it.

```
# ProcessTool — Claude Code Orientation

ProcessTool is an internal podcast/video production workflow tool for Podcast Royale.
This is a v2/v3 REBUILD. A working v1 exists as reference. PRD.md is the source of truth.

## v1 reference
The original working build is at ~/projects/starflight (Next.js/server-first).
Read it to match BEHAVIOR, not to copy code. Re-express its logic in this stack's
patterns. v1 may not compile — that's fine, it's a text reference only.

## Stack
Vite + React + TypeScript + TanStack Router + TanStack Query + Tailwind v4 + Supabase.
UI comes entirely from bm-design-system. Do NOT hand-roll styled components or ad-hoc CSS.
If a needed UI element is missing, add it to the design system and document it on the reference page.

## Domain
Workflow -> Process -> Tasks. A Process is a reusable template with conditional rules.
Applying a Process to an episode generates a one-time live task list (instance) at creation.
Template edits do NOT propagate to existing episodes. Instance edits are one-offs and do NOT propagate back.

## Rules (visibility + dependencies share ONE engine)
Four rule inputs: task completion, show settings value, episode tag, task field value.
Operators per input; AND/OR toggle across multiple rules. Same engine for both kinds;
they differ only in consequence: visibility fail = HIDDEN, dependency fail = BLOCKED.
Rules evaluate LIVE against the episode's current state (settings, tags, field values, completions).
A hidden task counts as not-complete / empty when referenced by another task's rules.

## Generation
Auto-generate on episode create. Materialize a row for EVERY task template; render only the
tasks that currently pass visibility. No "regenerate". Tags are applied to episodes after
creation and change the visible task set live (the episode-type workflow).

## Tags
First-class, globally managed, own nav item. Applied to EPISODES only. Settable via an
"add tag on completion" action. Readable by visibility AND dependency rules.

## Dates
Date rule = relationship (target field relative to an anchor + offset). Compute at generation
only what has an anchor; else null, filled later by the cascade (Phase 8). Never re-read the template.

## Hard rules
- No auto-save anywhere. Explicit Save/Update only.
- Browser talks directly to Supabase (anon key). RLS is the security boundary. Never use the service-role key client-side.
- Server state lives in TanStack Query: cache reads, prefetch on hover, optimistic updates on mutations.
- Admin users see the full sidebar; regular users see only Dashboard.
- One concern per change. When in doubt, re-read PRD.md and ask before expanding scope.

## Reorientation
If you lose context: re-read CLAUDE.md and PRD.md before continuing.
```

---

## 11. Out Of Scope (v2/v3, same as v1 unless noted)
- Public marketing site (separate repo if/when SaaS pivot — likely Astro).
- Multi-tenant org billing / enterprise SSO (only relevant on a SaaS pivot).
- Kanban views, recurring episodes (explicitly excluded in v1).
- Activity/audit log, external integrations beyond email.
- **Tag management is now IN scope** (Section 5C) — this line is removed from the v1 exclusions.
- **Episode "regenerate"** — deliberately excluded; generation is a one-time stamp, live visibility re-evaluation is not regeneration (Section 5B).

---

## Changelog (v2 → v3)
1. **Unified rule engine (Section 5A):** visibility and dependency rules now share one engine, four input types (task completion, show settings value, episode tag, task field value), shared operators, AND/OR toggle on both. They differ only in consequence (hide vs. block).
2. **Corrected visibility/generation model (Section 5B):** materialize a row for every task template; evaluate visibility *live*; render only qualifying tasks. Replaces the incorrect "resolve once, never create excluded tasks" framing, which could not support post-creation tag-driven visibility.
3. **Tags promoted to first-class (Section 5C):** own nav item + CRUD, episode-only application, set via completion action, read by rules. Removed from v1 out-of-scope list.
4. **Generation trigger = auto only:** no "regenerate" action; empty-episode manual fallback retained.
5. **Hidden-task reference rule:** a hidden task counts as not-complete / empty for other tasks' rules.
6. **Date model clarified (Section 5D):** rule-as-relationship, compute-when-anchor-exists, cascade assigned to Phase 8.
7. **Phases re-sequenced (Phases 1–6 left untouched as built):** new Phase 7.5 (tags), Phase 7.6 (unified rule authoring, template side — the work that would have extended Phase 5 had it not already shipped), and Phase 7.7 (unified instance-side live rule evaluation); Phase 8 gains orphan-dependency display + completion-triggered re-evaluation. Phases 8–16 keep their numbers.