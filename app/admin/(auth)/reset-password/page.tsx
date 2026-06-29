import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Where the password-recovery email link lands. The /api/auth/callback exchanges
// the recovery code for a session first, so updateUser() here is authenticated.
export default function ResetPasswordPage() {
  return (
    <main className="admin-auth">
      <div className="admin-auth-card">
        <div className="admin-auth-brand">
          <span className="admin-brand-mark">E8</span> Edge8 OS
        </div>
        <p className="admin-auth-sub">Set a new password.</p>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
