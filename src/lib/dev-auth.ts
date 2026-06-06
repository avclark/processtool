/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TEMPORARY DEV-AUTH BRIDGE — removed entirely in Phase 11      │
 * │                                                                 │
 * │  Signs in as the v1 test user so RLS-protected reads work      │
 * │  during development before real auth is built.                  │
 * │  Credentials come from .env.local:                              │
 * │    VITE_DEV_AUTH_EMAIL / VITE_DEV_AUTH_PASSWORD                 │
 * │                                                                 │
 * │  This is the ONLY place signInWithPassword is called.           │
 * │  All other code just assumes a session exists.                  │
 * └─────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";
import { supabase } from "@/lib/supabase";

type DevAuthStatus = "loading" | "authenticated" | "error";

export function useDevAuth() {
  const [status, setStatus] = React.useState<DevAuthStatus>("loading");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function authenticate() {
      // If already signed in (e.g. page reload), skip sign-in
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        if (!cancelled) setStatus("authenticated");
        return;
      }

      const email = import.meta.env.VITE_DEV_AUTH_EMAIL;
      const password = import.meta.env.VITE_DEV_AUTH_PASSWORD;

      if (!email || !password) {
        if (!cancelled) {
          setStatus("error");
          setError(
            "Missing VITE_DEV_AUTH_EMAIL or VITE_DEV_AUTH_PASSWORD in .env.local",
          );
        }
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (cancelled) return;

      if (authError) {
        setStatus("error");
        setError(authError.message);
      } else {
        setStatus("authenticated");
      }
    }

    authenticate();
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, error };
}
