"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") ? "That sign-in link was invalid or expired. Please sign in again." : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Full navigation so the middleware + server layout re-run with the new cookie.
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="admin-alert admin-alert--err">{error}</div>}
      <div className="admin-field">
        <label className="admin-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="admin-input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="admin-field">
        <label className="admin-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="admin-input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
