# ProcessTool — PRD v2 (Vite + TanStack Rebuild)

**Status:** Build-ready
**Stack:** Vite + TanStack Router + TanStack Query + TypeScript + Supabase + Tailwind v4 + Brian Casel's `bm-design-system`
**Reuses:** The existing Supabase project (database, schema, auth, storage, all test data) from the v1 build — unchanged.

**Repo:** `~/projects/processtool` (this v2 build).
**v1 reference:** `~/projects/starflight` — the original working build. Claude Code reads it as a *behavioral reference* (how features work), not code to copy. v1 is Next.js/server-first; its logic is re-expressed in the new SPA stack, never pasted in. v1 does not need to compile or run to serve as a reference. Reference it from the logic-heavy phases onward (Phases 4–5 and later); the early scaffold phases don't need it.

---

## 0. Read This First

This is a **rebuild**, not a new product. A complete, working v1 of ProcessTool already exists (built on Next.js App Router). Every feature, behavior, and data structure described here was validated in v1. The discovery work is done. This document is the source of truth; the v1 codebase is the reference implementation.

**What changes in v2:**
- Frontend rebuilt as a true client-side SPA on Vite + TanStack Router.
- Data layer uses TanStack Query for caching, prefetching, and optimistic updates — this is what makes the app feel instantaneous.
- The entire visual layer comes from `bm-design-system`, installed on day one. We are abandoning *all* v1 styling.

**What does NOT change:**
- The Supabase project. Same database, same schema, same RLS, same auth, same storage buckets, same test data. We point the new app at the existing project.
- The data model, business logic, and interaction behaviors. These are re-expressed in the new stack, not redesigned.

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
- A **Process** is a reusable task template containing tasks, with conditionals based on show attributes.
- Applying a Process to a new episode **generates a live task list** (an instance) — a one-time stamp. Editing the template later does not retroactively change existing episodes.

### Key interaction patterns to preserve (verbatim from v1)
1. **Template-first architecture:** build the process once, stamp out episodes repeatedly.
2. **Organization/show-driven conditionality:** a show's attribute answers change which tasks appear automatically.
3. **Role abstraction:** templates stay generic ("Video Editor"); shows personalize the assignment (e.g. "Video Editor = JP").
4. **Mixed operational and data-entry tasks:** a task can be both "do this work" and "fill out this form."
5. **Embedded communication:** email tasks tie client communication to operational completion.
6. **Date cascading:** setting a date on one task ripples through dependent tasks automatically.
7. **Explicit save:** nothing persists until the user clicks Update/Save.
8. **Instance edits are one-offs:** changes inside an episode never propagate back to the process or other episodes.

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
- conditionals / dependencies tables
- Supabase Auth tables + invite token handling
- Storage buckets for file-attachment blocks

> The schema is already in Supabase. Phase 2 reconciles the app's types against the live schema rather than recreating tables.

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

- **Admin users** see the full sidebar (Dashboard, Workflows, Shows, Processes, People).
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

## 6. Build Phases

Each phase = one branch = one (or a few tightly-scoped) Claude Code prompt(s). Verify in browser, commit, merge, move on. Phases are ordered by dependency. **Do not jump ahead.** Auth comes after the core app works (validated lesson from v1 — avoids fighting login redirects during development).

> Phase prompts below are summaries of intent and scope, including explicit "do NOT build yet" boundaries. Full per-phase prompts can be generated one at a time when you reach each phase.

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
- Apply a Process to a new episode → generate the live task list (`task_instances` + `task_instance_blocks`).
- Conditional logic resolves against the show's attribute answers at generation time.
- Date cascading computes instance dates.
- This is the most complex system behavior — treat it carefully; verify generated instances against v1 behavior.
- **Do NOT build:** instance editing or task completion yet.

### Phase 8 — Episode task list: completion, status, instance editing
**Branch:** `phase-8/episode-editing`
- Task status (open / blocked / completed) with blocked tasks rendered disabled.
- Live date cascading on the instance (setting a date ripples to dependents).
- One-off block editing on instance tasks (add/edit/delete blocks — does not propagate back).
- Drag-and-drop on the instance (reuse Phase 6 patterns).
- Optimistic updates for status toggles (this is a high-frequency interaction — make it feel instant).
- **Do NOT build:** email sending, notifications, or auth yet.

### Phase 9 — Command palette (Cmd+K) + global search
**Branch:** `phase-9/command-palette`
- Cmd+K palette with debounced search across episodes, shows, tasks, people, workflows, processes (trigram indexes already exist in Supabase).
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
- Verify every RLS policy actually protects client-direct access (see Section 7).
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
- **Do NOT build:** new features.

### Phase 15 — Full QA pass against v1 parity
**Branch:** `phase-15/qa-parity`
- Walk every feature against the v1 reference implementation and this PRD. Confirm behavior parity, especially: conditional generation, date cascading, instance one-off edits, invite flow.
- Fix regressions; no new scope.

### Phase 16 — Deploy + cutover
**Branch:** `phase-16/deploy`
- Deploy to Vercel (same project conventions). Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- Confirm SPA deep-link rewrite in production.
- Custom domain. Smoke test with real auth + real (test) data.
- Merge to `main`. Start using it.

> Sixteen phases, but most are light. The weight is concentrated in Phase 5 (builder), Phase 7 (generation), Phase 11 (auth), and Phase 12 (notifications) — the same places that were heavy in v1. The phase that broke v1 (the UI/design pass) no longer exists as a phase; it's Phase 1 and it's woven through everything.

---

## 7. Supabase RLS — What To Verify Before Building (CRITICAL for the SPA)

In v1 (server-capable Next), some logic may have run server-side, so RLS could have been more permissive than is safe for a pure SPA. In v2 the browser talks **directly** to Supabase with the anon key, so **RLS is the entire security boundary.** Verify the following in the Supabase dashboard (Authentication → Policies, and SQL editor) before Phase 4.

### Checklist
1. **RLS is ENABLED on every table** that holds real data. Any table with RLS disabled is world-readable/writable via the anon key. Run:
   ```sql
   select schemaname, tablename, rowsecurity
   from pg_tables
   where schemaname = 'public'
   order by tablename;
   ```
   Every app table should show `rowsecurity = true`.

2. **Every table has explicit policies** for the operations the app performs (select/insert/update/delete). With RLS on and no policy, access is denied (safe but the app breaks); with RLS off, access is wide open (unsafe). You want RLS on + correct policies. List them:
   ```sql
   select tablename, policyname, cmd, qual, with_check
   from pg_policies
   where schemaname = 'public'
   order by tablename, cmd;
   ```

3. **Policies key off the authenticated user, not a trusted server.** Each policy's `USING` / `WITH CHECK` should reference `auth.uid()` (or a membership lookup from it), e.g. "user can read a workflow only if they belong to its organization." If any policy is effectively `true` for `anon` or relies on "the server already checked," it must be tightened.

4. **No service-role key in the client.** The SPA uses only the anon key. The service-role key (which bypasses RLS) must never ship to the browser — it stays server-side (Edge Functions / cron only).

5. **Storage bucket policies** mirror table policies: only authorized users can read/write objects in the file-attachment buckets. Check Storage → Policies.

6. **Auth/invite tables** behave correctly under RLS for the invite + linking flow (Phase 11 depends on this).

### How to act on it
- If policies are already `auth.uid()`-based and strict (likely, if v1 followed Supabase conventions): you're good — just confirm.
- If any table has RLS off or an overly-permissive policy: tighten it **before** Phase 4 wiring, since the SPA will lean on it for real.
- Don't change the schema or data — this is a policy review, not a migration.

---

## 8. Known v1 Bugs To Bake In As Spec (don't rediscover)

| Issue (v1) | Resolution to encode up front | Carries to v2? |
|---|---|---|
| Invite email used default `ConfirmationURL`, broke linking | Route invite via `token_hash` through `/auth/callback` | Yes (Supabase-level) — Phase 11 |
| Hash-based deep linking fragile | Use TanStack Router routes + host rewrite rule | Replaced by SPA routing — Phase 1 |
| Storage bucket quirks during upload | Confirm bucket policies + path conventions before wiring | Yes — Phase 10 |
| dnd-kit integration friction | Isolate in its own phase, after core editing works | Yes — Phase 6 |
| Scheduled notifications fired twice / untracked | `notifications_sent` jsonb per task; check before send | Yes — Phase 12 |
| Large combined prompts dropped work | One concern per prompt; explicit "do NOT build" | Process — all phases |

**Will NOT carry over** (Next-specific, simply absent in the SPA): server-action edge cases, App Router routing quirks, the middleware/proxy deprecation warning, RSC hydration mismatches.
**New, smaller set to watch:** SPA deep-link rewrite, client-side route guards, ensuring RLS is airtight (Section 7), TanStack Query cache-invalidation correctness after mutations.

---

## 9. Reusing Existing Supabase Data

The v2 app points at the **same Supabase project** as v1. All test podcasts, test users, test workflows, conditionals, and dependencies created during v1 testing remain and are reused — no re-entry. Concretely:
- Same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (the v1 `NEXT_PUBLIC_*` values).
- Same schema → generate types from it (Phase 2).
- Same auth users and invite state.
- Same storage buckets and objects.
The only pre-work is the RLS review in Section 7.

---

## 10. CLAUDE.md (paste into project root)

> Keep this short; it orients Claude Code every session. The design-system plugin also maintains its own managed block in CLAUDE.md — do not remove it.

```
# ProcessTool — Claude Code Orientation

ProcessTool is an internal podcast/video production workflow tool for Podcast Royale.
This is a v2 REBUILD. A working v1 exists as reference. PRD.md is the source of truth.

## v1 reference
The original working build is at ~/projects/starflight (Next.js/server-first).
Read it to match BEHAVIOR, not to copy code. Re-express its logic in this stack's
patterns. v1 may not compile — that's fine, it's a text reference only.

## Stack
Vite + React + TypeScript + TanStack Router + TanStack Query + Tailwind v4 + Supabase.
UI comes entirely from bm-design-system. Do NOT hand-roll styled components or ad-hoc CSS.
If a needed UI element is missing, add it to the design system and document it on the reference page.

## Domain
Workflow -> Process -> Tasks. A Process is a reusable template with show-attribute conditionals.
Applying a Process to an episode generates a one-time live task list (instance). Template edits
do NOT propagate to existing episodes. Instance edits are one-offs and do NOT propagate back.

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

## 11. Out Of Scope (v2, same as v1 unless noted)
- Public marketing site (separate repo if/when SaaS pivot — likely Astro).
- Multi-tenant org billing / enterprise SSO (only relevant on a SaaS pivot).
- Kanban views, recurring episodes (explicitly excluded in v1).
- Activity/audit log, tag management, external integrations beyond email (not built in v1).
