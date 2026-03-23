import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import { isAccessGroupTablesMissingError } from "@/lib/admin-user-access";
import SecurityMetricCards from "../SecurityMetricCards";
import { compactList } from "../security-utils";
import RolesManager from "./roles-manager";

type RoleRecord = {
  id: string;
  roleKey: string;
  roleName: string;
  description: string | null;
  isSystemRole: boolean;
  rolePermissions: Array<{
    permission: {
      id: string;
      category: string;
      permissionKey: string;
    };
  }>;
  _count: {
    accessGroupRoleAssignments: number;
    userRoleAssignments: number;
    userRoles: number;
  };
};

type PermissionOption = {
  id: string;
  permissionKey: string;
  permissionName: string;
  category: string;
};

export const dynamic = "force-dynamic";

export default async function AdminSecurityRolesPage() {
  const currentUser = await requireAdminPermission("roles.view");
  let accessGroupsAvailable = true;
  let roles: RoleRecord[] = [];
  let permissions: PermissionOption[] = [];
  let roleCount = 0;
  let systemRoleCount = 0;
  let assignmentCount = 0;

  try {
    [roles, permissions, roleCount, systemRoleCount, assignmentCount] = await Promise.all([
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
                  id: true,
                  category: true,
                  permissionKey: true,
                },
              },
            },
          },
          _count: {
            select: {
              accessGroupRoleAssignments: true,
              userRoleAssignments: true,
              userRoles: true,
            },
          },
        },
      }),
      prisma.permission.findMany({
        orderBy: [{ category: "asc" }, { permissionKey: "asc" }],
        select: {
          id: true,
          permissionKey: true,
          permissionName: true,
          category: true,
        },
      }),
      prisma.role.count(),
      prisma.role.count({ where: { isSystemRole: true } }),
      prisma.userRoleAssignment.count(),
    ]);
  } catch (error) {
    if (!isAccessGroupTablesMissingError(error)) {
      throw error;
    }

    accessGroupsAvailable = false;

    const [legacyRoles, nextPermissions, nextRoleCount, nextSystemRoleCount, nextAssignmentCount] =
      await Promise.all([
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
                    id: true,
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
        prisma.permission.findMany({
          orderBy: [{ category: "asc" }, { permissionKey: "asc" }],
          select: {
            id: true,
            permissionKey: true,
            permissionName: true,
            category: true,
          },
        }),
        prisma.role.count(),
        prisma.role.count({ where: { isSystemRole: true } }),
        prisma.userRoleAssignment.count(),
      ]);

    roles = legacyRoles.map((role) => ({
      ...role,
      _count: {
        ...role._count,
        accessGroupRoleAssignments: 0,
      },
    }));
    permissions = nextPermissions;
    roleCount = nextRoleCount;
    systemRoleCount = nextSystemRoleCount;
    assignmentCount = nextAssignmentCount;
  }

  const roleRows = roles.map((role) => ({
    id: role.id,
    roleKey: role.roleKey,
    roleName: role.roleName,
    description: role.description,
    isSystemRole: role.isSystemRole,
    permissionIds: role.rolePermissions.map((rolePermission) => rolePermission.permission.id),
    usageSummary: [
      `${role._count.userRoleAssignments} scoped assignments`,
      `${role._count.userRoles} legacy user-role links`,
      `${role._count.accessGroupRoleAssignments} group grants`,
    ],
  }));

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

      <RolesManager
        roles={roleRows}
        permissions={permissions}
        canManage={currentUser.permissions.includes("roles.manage")}
      />

      {!accessGroupsAvailable ? (
        <section className="admin-security-panel admin-table-card">
          <div className="admin-security-panel-header">
            <div>
              <p className="admin-security-kicker">Migration Required</p>
              <h2>Group Grants Unavailable</h2>
              <p>
                This database has not applied the additive access-group migration yet.
                Role data is available, but group grant counts are temporarily hidden.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}