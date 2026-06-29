"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { PasswordField } from "@/components/admin/PasswordField";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/admin";
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") ? "That sign-in link was invalid or expired. Please sign in again." : null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/admin/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNotice(`If an account exists for ${email.trim().toLowerCase()}, a password reset link is on its way.`);
  }

  if (mode === "reset") {
    return (
      <form className="admin-form" onSubmit={handleReset}>
        {error && <div className="admin-alert admin-alert--err">{error}</div>}
        {notice && <div className="admin-alert admin-alert--ok">{notice}</div>}
        <p className="admin-auth-sub" style={{ marginTop: 0 }}>
          Enter your email and we will send a link to reset your password.
        </p>
        <div className="admin-field">
          <label className="admin-label" htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            className="admin-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </div>
        <button
          type="button"
          className="admin-auth-link"
          onClick={() => {
            setMode("signin");
            setError(null);
            setNotice(null);
          }}
        >
          ← Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form className="admin-form" onSubmit={handleSignIn}>
      {error && <div className="admin-alert admin-alert--err">{error}</div>}
      {notice && <div className="admin-alert admin-alert--ok">{notice}</div>}
      <div className="admin-field">
        <label className="admin-label" htmlFor="email">Email</label>
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
        <div className="admin-label-row">
          <label className="admin-label" htmlFor="password">Password</label>
          <button
            type="button"
            className="admin-auth-link"
            onClick={() => {
              setMode("reset");
              setError(null);
              setNotice(null);
            }}
          >
            Forgot password?
          </button>
        </div>
        <PasswordField id="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>
      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
