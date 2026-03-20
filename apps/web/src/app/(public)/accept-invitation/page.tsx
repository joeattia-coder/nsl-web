import { Suspense } from "react";
import AcceptInvitationForm from "./AcceptInvitationForm";

export default function AcceptInvitationPage() {
  return (
    <section className="login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <p className="login-page-kicker">Player Access</p>
          <h1 className="login-page-title">Set up your account</h1>
          <p className="login-page-subtitle">
            Accept your invitation by setting a password for your NSL account.
          </p>
        </div>

        <Suspense fallback={null}>
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </section>
  );
}
