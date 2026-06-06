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
- Do NOT change, upgrade, or unpin any dependency versions.

## Reorientation
If you lose context: re-read CLAUDE.md and PRD.md before continuing.
