import { prisma } from "@/lib/prisma";
import { requireAnyAdminPermission } from "@/lib/admin-auth";
import { getVisibleUsersWhere, isAccessGroupTablesMissingError } from "@/lib/admin-user-access";
import SecurityMetricCards from "../SecurityMetricCards";
import { compactList, formatDate, formatScope } from "../security-utils";
import { formatUserDisplayName } from "../security-utils";
import GroupsManager from "./groups-manager";

type GroupUserSummary = {
  id: string;
  username: string | null;
  email: string | null;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
};

type GroupRoleOption = {
  id: string;
  roleKey: string;
  roleName: string;
};

type AccessGroupRecord = {
  id: string;
  groupName: string;
  description: string | null;
  isActive: boolean;
  memberships: Array<{
    userId: string;
    user: Omit<GroupUserSummary, "id">;
  }>;
  roleAssignments: Array<{
    role: {
      id: string;
      roleName: string;
    };
    scopeType: string;
    scopeId: string;
    expiresAt: Date | null;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminSecurityGroupsPage() {
  const currentUser = await requireAnyAdminPermission(["users.view", "roles.view"]);
  let accessGroupsAvailable = true;
  let visibleUsersWhere = getVisibleUsersWhere(currentUser);
  let groups: AccessGroupRecord[] = [];
  let groupCount = 0;
  let activeGroupCount = 0;
  let membershipCount = 0;
  let roleGrantCount = 0;
  let users: GroupUserSummary[] = [];
  let roles: GroupRoleOption[] = [];

  try {
    [groups, groupCount, activeGroupCount, membershipCount, roleGrantCount, users, roles] =
      await Promise.all([
        prisma.accessGroup.findMany({
          orderBy: [{ isActive: "desc" }, { groupName: "asc" }],
          select: {
            id: true,
            groupName: true,
            description: true,
            isActive: true,
            memberships: {
              select: {
                userId: true,
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
              },
            },
            roleAssignments: {
              select: {
                role: {
                  select: {
                    id: true,
                    roleName: true,
                  },
                },
                scopeType: true,
                scopeId: true,
                expiresAt: true,
              },
            },
            _count: {
              select: {
                memberships: true,
                roleAssignments: true,
              },
            },
          },
        }),
        prisma.accessGroup.count(),
        prisma.accessGroup.count({ where: { isActive: true } }),
        prisma.accessGroupMembership.count(),
        prisma.accessGroupRoleAssignment.count(),
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
        prisma.role.findMany({
          orderBy: [{ isSystemRole: "desc" }, { roleName: "asc" }],
          select: {
            id: true,
            roleKey: true,
            roleName: true,
          },
        }),
      ]);
  } catch (error) {
    if (!isAccessGroupTablesMissingError(error)) {
      throw error;
    }

    accessGroupsAvailable = false;
    visibleUsersWhere = getVisibleUsersWhere(currentUser, { includeAccessGroups: false });

    const [nextUsers, nextRoles] = await Promise.all([
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
      prisma.role.findMany({
        orderBy: [{ isSystemRole: "desc" }, { roleName: "asc" }],
        select: {
          id: true,
          roleKey: true,
          roleName: true,
        },
      }),
    ]);

    groups = [];
    groupCount = 0;
    activeGroupCount = 0;
    membershipCount = 0;
    roleGrantCount = 0;
    users = nextUsers;
    roles = nextRoles;
  }

  const groupRows = groups.map((group) => ({
    id: group.id,
    groupName: group.groupName,
    description: group.description,
    isActive: group.isActive,
    memberUserIds: group.memberships.map((membership) => membership.userId),
    memberLabels: group.memberships.map((membership) => formatUserDisplayName(membership.user)),
    assignments: group.roleAssignments.map((assignment) => ({
      roleId: assignment.role.id,
      roleName: assignment.role.roleName,
      scopeType: assignment.scopeType,
      scopeId: assignment.scopeId,
      expiresAt: assignment.expiresAt?.toISOString() ?? null,
    })),
  }));

  const userOptions = users.map((user) => ({
    id: user.id,
    label: formatUserDisplayName(user),
  })).sort((left, right) => left.label.localeCompare(right.label));

  return (
    <div className="admin-security-stack">
      <SecurityMetricCards
        metrics={[
          {
            label: "Groups",
            value: groupCount,
            hint: "Access groups available to bundle members and inherited grants.",
          },
          {
            label: "Active Groups",
            value: activeGroupCount,
            hint: "Groups currently contributing inherited access.",
          },
          {
            label: "Memberships",
            value: membershipCount,
            hint: "User-to-group links active across the security model.",
          },
          {
            label: "Group Grants",
            value: roleGrantCount,
            hint: "Role assignments attached to groups rather than individuals.",
          },
        ]}
      />

      {accessGroupsAvailable ? (
        <GroupsManager
          groups={groupRows}
          users={userOptions}
          roles={roles}
          canManage={
            currentUser.permissions.includes("users.edit") &&
            currentUser.permissions.includes("roles.manage")
          }
        />
      ) : (
        <section className="admin-security-panel admin-table-card">
          <div className="admin-security-panel-header">
            <div>
              <p className="admin-security-kicker">Migration Required</p>
              <h2>Access Groups Unavailable</h2>
              <p>
                This database does not have the access-group tables yet. Apply the
                additive security migration to manage groups, memberships, and group grants.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}