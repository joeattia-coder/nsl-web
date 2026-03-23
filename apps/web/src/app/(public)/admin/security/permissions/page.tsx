import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import SecurityMetricCards from "../SecurityMetricCards";
import PermissionsManager from "./permissions-manager";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPermissionsPage() {
  const currentUser = await requireAdminPermission("permissions.view");

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

      <PermissionsManager
        permissions={permissions.map((permission) => ({
          id: permission.id,
          permissionKey: permission.permissionKey,
          permissionName: permission.permissionName,
          category: permission.category,
          description: permission.description,
          roleLinkCount: permission._count.rolePermissions,
          overrideCount: permission._count.userPermissionOverrides,
        }))}
        canManage={currentUser.permissions.includes("permissions.manage")}
      />
    </div>
  );
}