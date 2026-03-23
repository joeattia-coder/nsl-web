import { prisma } from "@/lib/prisma";
import { requireAnyAdminPermission } from "@/lib/admin-auth";
import { getVisibleUsersWhere, isAccessGroupTablesMissingError } from "@/lib/admin-user-access";
import SecurityMetricCards from "../SecurityMetricCards";
import {
  formatDate,
  formatScope,
  formatUserDisplayName,
} from "../security-utils";
import OverridesManager from "./overrides-manager";

type OverrideUserSummary = {
  id: string;
  username: string | null;
  email: string | null;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
};

type OverridePermissionOption = {
  id: string;
  permissionKey: string;
  permissionName: string;
};

type OverrideRecord = {
  id: string;
  effect: string;
  scopeType: string;
  scopeId: string;
  reason: string | null;
  expiresAt: Date | null;
  permission: {
    permissionKey: string;
    permissionName: string;
  };
  user: Omit<OverrideUserSummary, "id">;
  grantedByUser: Omit<OverrideUserSummary, "id"> | null;
};

export const dynamic = "force-dynamic";

export default async function AdminSecurityOverridesPage() {
  const currentUser = await requireAnyAdminPermission(["users.view", "permissions.view"]);
  let accessGroupsAvailable = true;
  let visibleUsersWhere = getVisibleUsersWhere(currentUser);
  let overrides: OverrideRecord[] = [];
  let permissions: OverridePermissionOption[] = [];
  let users: OverrideUserSummary[] = [];
  let overrideCount = 0;
  let allowCount = 0;
  let denyCount = 0;

  try {
    [overrides, permissions, users, overrideCount, allowCount, denyCount] = await Promise.all([
      prisma.userPermissionOverride.findMany({
        orderBy: [{ createdAt: "desc" }],
        where: {
          user: visibleUsersWhere,
        },
        select: {
          id: true,
          effect: true,
          scopeType: true,
          scopeId: true,
          reason: true,
          expiresAt: true,
          permission: {
            select: {
              permissionKey: true,
              permissionName: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
            },
          },
          grantedByUser: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
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
        },
      }),
      prisma.user.findMany({
        where: visibleUsersWhere,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          username: true,
          email: true,
          player: {
            select: {
              firstName: true,
              middleInitial: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.userPermissionOverride.count({ where: { user: visibleUsersWhere } }),
      prisma.userPermissionOverride.count({ where: { user: visibleUsersWhere, effect: "ALLOW" } }),
      prisma.userPermissionOverride.count({ where: { user: visibleUsersWhere, effect: "DENY" } }),
    ]);
  } catch (error) {
    if (!isAccessGroupTablesMissingError(error)) {
      throw error;
    }

    accessGroupsAvailable = false;
    visibleUsersWhere = getVisibleUsersWhere(currentUser, { includeAccessGroups: false });

    [overrides, permissions, users, overrideCount, allowCount, denyCount] = await Promise.all([
      prisma.userPermissionOverride.findMany({
        orderBy: [{ createdAt: "desc" }],
        where: {
          user: visibleUsersWhere,
        },
        select: {
          id: true,
          effect: true,
          scopeType: true,
          scopeId: true,
          reason: true,
          expiresAt: true,
          permission: {
            select: {
              permissionKey: true,
              permissionName: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
            },
          },
          grantedByUser: {
            select: {
              username: true,
              email: true,
              player: {
                select: {
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                },
              },
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
        },
      }),
      prisma.user.findMany({
        where: visibleUsersWhere,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          username: true,
          email: true,
          player: {
            select: {
              firstName: true,
              middleInitial: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.userPermissionOverride.count({ where: { user: visibleUsersWhere } }),
      prisma.userPermissionOverride.count({ where: { user: visibleUsersWhere, effect: "ALLOW" } }),
      prisma.userPermissionOverride.count({ where: { user: visibleUsersWhere, effect: "DENY" } }),
    ]);
  }

  return (
    <div className="admin-security-stack">
      <SecurityMetricCards
        metrics={[
          {
            label: "Overrides",
            value: overrideCount,
            hint: "Per-user exceptions applied outside the standard role model.",
          },
          {
            label: "Allow",
            value: allowCount,
            hint: "Overrides that explicitly grant a permission.",
          },
          {
            label: "Deny",
            value: denyCount,
            hint: "Overrides that explicitly suppress a permission.",
          },
          {
            label: "Expiring",
            value: overrides.filter((override) => override.expiresAt).length,
            hint: "Overrides configured to expire automatically.",
          },
        ]}
      />

      <OverridesManager
        overrides={overrides.map((override) => ({
          id: override.id,
          userLabel: formatUserDisplayName(override.user),
          permissionName: override.permission.permissionName,
          permissionKey: override.permission.permissionKey,
          effect: override.effect,
          scopeLabel: formatScope(override.scopeType, override.scopeId),
          grantedByLabel: override.grantedByUser
            ? formatUserDisplayName(override.grantedByUser)
            : "System",
          reason: override.reason ?? "-",
          expiresAtLabel: formatDate(override.expiresAt),
        }))}
        users={users.map((user) => ({
          id: user.id,
          label: formatUserDisplayName(user),
        }))}
        permissions={permissions}
        canManage={
          currentUser.permissions.includes("users.edit") &&
          currentUser.permissions.includes("permissions.manage")
        }
      />

      {!accessGroupsAvailable ? (
        <section className="admin-security-panel admin-table-card">
          <div className="admin-security-panel-header">
            <div>
              <p className="admin-security-kicker">Migration Required</p>
              <h2>Legacy Visibility Mode</h2>
              <p>
                Override data is available, but user visibility is currently evaluated
                without group inheritance until the access-group migration is applied.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}