import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveCurrentAdminUser } from "@/lib/admin-auth";

export default async function SettingsPage() {
  const currentUser = await resolveCurrentAdminUser();

  if (!currentUser) {
    redirect("/login?next=/settings");
  }

  return (
    <section className="admin-page login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <p className="login-page-kicker">Settings</p>
          <h1 className="login-page-title">Account settings</h1>
          <p className="login-page-subtitle">
            Review your current account access and use the password reset flow to
            rotate your credentials when needed.
          </p>
        </div>

        <div className="account-settings-grid">
          <section className="account-settings-panel">
            <h2>Identity</h2>
            <dl className="account-settings-list">
              <div>
                <dt>Name</dt>
                <dd>{currentUser.displayName}</dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>{currentUser.username ?? "Not set"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{currentUser.email ?? "Not set"}</dd>
              </div>
              <div>
                <dt>Account type</dt>
                <dd>{currentUser.isGlobalAdmin ? "Global admin" : "Admin"}</dd>
              </div>
            </dl>
          </section>

          <section className="account-settings-panel">
            <h2>Password</h2>
            <p>
              Use the reset flow to generate a fresh password link for this account.
              When SMTP is configured, the reset link is delivered by email.
            </p>
            <div className="account-settings-actions">
              <Link href="/reset-password" className="admin-link-button">
                Reset password
              </Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}