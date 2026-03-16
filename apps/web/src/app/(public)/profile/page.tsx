import { redirect } from "next/navigation";
import { resolveCurrentAdminUser } from "@/lib/admin-auth";

export default async function ProfilePage() {
  const currentUser = await resolveCurrentAdminUser();

  if (!currentUser) {
    redirect("/login?next=/profile");
  }

  return (
    <section className="admin-page login-page-shell">
      <div className="login-page-card">
        <div className="login-page-copy">
          <p className="login-page-kicker">Profile</p>
          <h1 className="login-page-title">{currentUser.displayName}</h1>
          <p className="login-page-subtitle">
            Signed in as {currentUser.email ?? currentUser.username ?? "Administrator"}.
          </p>
        </div>
      </div>
    </section>
  );
}