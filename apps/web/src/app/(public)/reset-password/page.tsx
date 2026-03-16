import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <section className="login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <p className="login-page-kicker">Account Recovery</p>
          <h1 className="login-page-title">Reset password</h1>
          <p className="login-page-subtitle">
            Request a password reset link for your admin account, or complete the
            reset if you already have a valid token.
          </p>
        </div>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}