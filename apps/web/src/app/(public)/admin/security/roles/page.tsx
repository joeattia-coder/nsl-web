import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import SecurityMetricCards from "../SecurityMetricCards";
import { compactList } from "../security-utils";

export const dynamic = "force-dynamic";

export default async function AdminSecurityRolesPage() {
  await requireAdminPermission("roles.view");

  const [roles, roleCount, systemRoleCount, assignmentCount] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ isSystemRole: "desc" }, { roleName: "asc" }],
      select: {
        id: true,
        roleKey: true,
        roleName: true,
        description: true,
        isSystemRole: true,
        rolePermissions: {
          select: {
            permission: {
              select: {
                category: true,
                permissionKey: true,
              },
            },
          },
        },
        _count: {
          select: {
            userRoleAssignments: true,
            userRoles: true,
          },
        },
      },
    }),
    prisma.role.count(),
    prisma.role.count({ where: { isSystemRole: true } }),
    prisma.userRoleAssignment.count(),
  ]);

  return (
    <div className="admin-security-stack">
      <SecurityMetricCards
        metrics={[
          {
            label: "Roles",
            value: roleCount,
            hint: "Broad responsibility bundles available to assign.",
          },
          {
            label: "System Roles",
            value: systemRoleCount,
            hint: "Roles seeded as first-class platform defaults.",
          },
          {
            label: "Custom Roles",
            value: roleCount - systemRoleCount,
            hint: "Roles introduced beyond the platform defaults.",
          },
          {
            label: "Assignments",
            value: assignmentCount,
            hint: "Scoped grants currently using the role model.",
          },
        ]}
      />

      <section className="admin-security-panel admin-table-card">
        <div className="admin-security-panel-header">
          <div>
            <p className="admin-security-kicker">Roles</p>
            <h2>Role Bundles</h2>
            <p>
              Review role definitions, how many permissions they bundle, and
              how widely they are assigned.
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Type</th>
                <th>Description</th>
                <th>Categories</th>
                <th>Permissions</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-security-empty-cell">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => {
                  const categories = Array.from(
                    new Set(
                      role.rolePermissions.map(
                        (rolePermission) => rolePermission.permission.category
                      )
                    )
                  );

                  return (
                    <tr key={role.id}>
                      <td>
                        <div className="admin-security-cell-stack">
                          <strong>{role.roleName}</strong>
                          <span className="admin-security-muted">{role.roleKey}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-security-badge ${
                            role.isSystemRole
                              ? "admin-security-badge-positive"
                              : "admin-security-badge-muted"
                          }`}
                        >
                          {role.isSystemRole ? "System" : "Custom"}
                        </span>
                      </td>
                      <td>{role.description ?? "No description"}</td>
                      <td>{compactList(categories)}</td>
                      <td>{role.rolePermissions.length}</td>
                      <td>
                        <div className="admin-security-cell-stack">
                          <span>{role._count.userRoleAssignments} scoped assignments</span>
                          <span>{role._count.userRoles} legacy user-role links</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}