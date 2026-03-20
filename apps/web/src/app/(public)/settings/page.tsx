import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/lib/admin-auth";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function SettingsPage() {
  const currentUser = await resolveCurrentUser();

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
            Review your account details and update your credentials.
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
                <dd>
                  {currentUser.isGlobalAdmin
                    ? "Global admin"
                    : currentUser.isAdmin
                    ? "Admin"
                    : "Player"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="account-settings-panel">
            <h2>Password</h2>
            <p>
              Change your password while signed in. You can still use reset links
              if you ever lose account access.
            </p>
            <ChangePasswordForm />
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