/**
 * TEMPORARY smoke-test auth + queries — remove in Phase 3.
 */
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { useShows, useWorkflows } from "@/lib/queries/smoke-test";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_shell/dashboard")({
  component: DashboardPage,
});

// ── TEMPORARY: smoke-test auth ──────────────────────────────────────
// Signs in as the v1 test user so RLS-protected reads work.
// Credentials come from .env.local (VITE_SMOKE_TEST_EMAIL / PASSWORD).
// This entire block is removed in Phase 3 when real auth lands.
function useSmokeTestAuth() {
  const [status, setStatus] = React.useState<
    "idle" | "signing-in" | "authenticated" | "error"
  >("idle");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const email = import.meta.env.VITE_SMOKE_TEST_EMAIL;
    const password = import.meta.env.VITE_SMOKE_TEST_PASSWORD;

    if (!email || !password) {
      setStatus("error");
      setError(
        "Missing VITE_SMOKE_TEST_EMAIL or VITE_SMOKE_TEST_PASSWORD in .env.local",
      );
      return;
    }

    setStatus("signing-in");

    supabase.auth
      .signInWithPassword({ email, password })
      .then(({ error: authError }) => {
        if (authError) {
          setStatus("error");
          setError(authError.message);
        } else {
          setStatus("authenticated");
        }
      });
  }, []);

  return { status, error };
}
// ── END TEMPORARY ───────────────────────────────────────────────────

function DashboardPage() {
  const auth = useSmokeTestAuth();

  return (
    <>
      <div className="border-b border-hairline pb-6">
        <h1>Dashboard</h1>
      </div>

      {/* ── TEMPORARY: Phase 2 smoke test ── */}
      <div className="mt-8 rounded-lg border border-signal-faded bg-signal-faded p-6">
        <div className="mb-4 flex items-center gap-2">
          <Badge tone="signal">Temporary</Badge>
          <h2 className="text-lg">Phase 2 Smoke Test</h2>
        </div>
        <p className="mb-6 text-sm text-ink-muted">
          Proves Supabase connection, types, RLS, and TanStack Query work
          end-to-end. Removed in Phase 3.
        </p>

        {auth.status === "signing-in" && (
          <p className="text-sm text-ink-muted">Signing in as test user...</p>
        )}
        {auth.status === "error" && (
          <div className="callout callout-danger">
            <p>
              <strong>Auth error:</strong> {auth.error}
            </p>
          </div>
        )}
        {auth.status === "authenticated" && <SmokeTestResults />}
      </div>
      {/* ── END TEMPORARY ── */}
    </>
  );
}

function SmokeTestResults() {
  const shows = useShows();
  const workflows = useWorkflows();

  return (
    <div className="space-y-6">
      <SmokeTestTable
        label="Shows"
        query={shows}
        columns={["name", "created_at"]}
      />
      <SmokeTestTable
        label="Workflows"
        query={workflows}
        columns={["name", "created_at"]}
      />
    </div>
  );
}

function SmokeTestTable({
  label,
  query,
  columns,
}: {
  label: string;
  query: { data?: Array<Record<string, unknown>> | null; isLoading: boolean; error: unknown };
  columns: string[];
}) {
  if (query.isLoading) {
    return <p className="text-sm text-ink-muted">Loading {label}...</p>;
  }

  if (query.error) {
    return (
      <div className="callout callout-danger">
        <p>
          <strong>{label} error:</strong>{" "}
          {query.error instanceof Error ? query.error.message : String(query.error)}
        </p>
      </div>
    );
  }

  const rows = query.data ?? [];

  return (
    <div>
      <h3 className="mb-2">
        {label}{" "}
        <Badge tone="accent">{rows.length}</Badge>
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No rows returned.</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-page">
          {rows.map((row, i) => (
            <li key={String(row.id ?? i)} className="px-4 py-3">
              <div className="flex items-center gap-4 text-sm">
                {columns.map((col) => (
                  <span key={col} className="text-ink-body">
                    <span className="text-ink-muted">{col}:</span>{" "}
                    {String(row[col] ?? "—")}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
