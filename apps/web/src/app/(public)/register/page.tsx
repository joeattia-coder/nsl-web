import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <section className="login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <p className="login-page-kicker">Player Registration</p>
          <h1 className="login-page-title">Create your player account</h1>
          <p className="login-page-subtitle">
            Register with the form and verify your email, or use Google/Facebook for instant account creation.
          </p>
        </div>

        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </section>
  );
}
