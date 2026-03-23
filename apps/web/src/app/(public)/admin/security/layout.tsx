import { requireAnyAdminPermission } from "@/lib/admin-auth";
import SecuritySubnav from "./SecuritySubnav";

export default async function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAnyAdminPermission(["users.view", "roles.view", "permissions.view"]);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Security</h1>
          <p className="admin-page-subtitle">
            Manage users, access groups, role bundles, permission definitions,
            assignments, and per-user overrides in one section.
          </p>
        </div>
      </div>

      <SecuritySubnav />

      {children}
    </section>
  );
}