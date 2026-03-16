import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import SecurityMetricCards from "../SecurityMetricCards";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPermissionsPage() {
  await requireAdminPermission("permissions.view");

  const permissions = await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { permissionKey: "asc" }],
    select: {
      id: true,
      permissionKey: true,
      permissionName: true,
      category: true,
      description: true,
      _count: {
        select: {
          rolePermissions: true,
          userPermissionOverrides: true,
        },
      },
    },
  });

  const categoryCount = new Set(
    permissions.map((permission) => permission.category)
  ).size;
  const mappedRolePermissionCount = permissions.reduce(
    (sum, permission) => sum + permission._count.rolePermissions,
    0
  );
  const overrideCount = permissions.reduce(
    (sum, permission) => sum + permission._count.userPermissionOverrides,
    0
  );

  return (
    <div className="admin-security-stack">
      <SecurityMetricCards
        metrics={[
          {
            label: "Permissions",
            value: permissions.length,
            hint: "Fine-grained actions the platform can authorize.",
          },
          {
            label: "Categories",
            value: categoryCount,
            hint: "Operational groupings used to organize the catalog.",
          },
          {
            label: "Role Links",
            value: mappedRolePermissionCount,
            hint: "Total role-to-permission mappings currently defined.",
          },
          {
            label: "Overrides",
            value: overrideCount,
            hint: "Per-user permission exceptions attached to the catalog.",
          },
        ]}
      />

      <section className="admin-security-panel admin-table-card">
        <div className="admin-security-panel-header">
          <div>
            <p className="admin-security-kicker">Permissions</p>
            <h2>Permission Catalog</h2>
            <p>
              Audit the action catalog, how it is grouped, and where it is
              already linked into roles or user-specific overrides.
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Category</th>
                <th>Description</th>
                <th>Role Links</th>
                <th>Overrides</th>
              </tr>
            </thead>
            <tbody>
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-security-empty-cell">
                    No permissions found.
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td>
                      <div className="admin-security-cell-stack">
                        <strong>{permission.permissionName}</strong>
                        <span className="admin-security-muted">
                          {permission.permissionKey}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-security-badge admin-security-badge-muted">
                        {permission.category}
                      </span>
                    </td>
                    <td>{permission.description ?? "No description"}</td>
                    <td>{permission._count.rolePermissions}</td>
                    <td>{permission._count.userPermissionOverrides}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}