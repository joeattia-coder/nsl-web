import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <section className="login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <p className="login-page-kicker">Account Access</p>
          <h1 className="login-page-title">Sign in</h1>
          <p className="login-page-subtitle">
            Use your email or username to sign in with a password, request a
            reset link, or continue with a linked Google or Facebook account.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}