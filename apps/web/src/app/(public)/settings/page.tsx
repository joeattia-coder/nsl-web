import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import PlayerPortalHeader from "../PlayerPortalHeader";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function SettingsPage() {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/settings");
  }

  const linkedPlayer = currentUser.linkedPlayerId
    ? await prisma.player.findUnique({
        where: {
          id: currentUser.linkedPlayerId,
        },
        select: {
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      })
    : null;

  const playerName = linkedPlayer
    ? `${linkedPlayer.firstName} ${linkedPlayer.lastName}`.trim()
    : currentUser.displayName ?? currentUser.username ?? currentUser.email ?? "Settings";

  return (
    <section className="admin-page login-page-shell player-dashboard-page player-profile-page">
      <div className="login-page-card player-portal-shell player-dashboard-card">
        <PlayerPortalHeader
          kicker="Settings"
          title="Account settings"
          subtitle="Review your account details, manage password changes, and keep your player account secure."
          avatarLabel={playerName}
          avatarUrl={linkedPlayer?.photoUrl}
        />

        <div className="player-portal-content player-portal-content-medium">
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
      </div>
    </section>
  );
}