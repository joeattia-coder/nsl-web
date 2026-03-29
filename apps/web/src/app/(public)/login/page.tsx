import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <section className="login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <div className="login-page-header-row">
            <p className="login-page-kicker">Account Access</p>
            <Link href="/" className="login-page-close-button" aria-label="Close login">
              ×
            </Link>
          </div>
          <h1 className="login-page-title">Sign in</h1>
          <p className="login-page-subtitle">
            Use your email or username to sign in with a password, request a
            reset link, or create a new player account.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}