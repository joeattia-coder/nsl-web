import { prisma } from "@/lib/prisma";
import { requireAnyAdminPermission } from "@/lib/admin-auth";
import { getVisibleUsersWhere, isAccessGroupTablesMissingError } from "@/lib/admin-user-access";
import SecurityMetricCards from "../SecurityMetricCards";
import {
  formatDate,
  formatDateTime,
  formatScope,
  formatUserDisplayName,
} from "../security-utils";
import AssignmentsManager from "./assignments-manager";

type AssignmentUserSummary = {
  username: string | null;
  email: string | null;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
};

type UserAssignmentRecord = {
  id: string;
  scopeType: string;
  scopeId: string;
  createdAt: Date;
  expiresAt: Date | null;
  role: {
    roleName: string;
  };
  user: AssignmentUserSummary;
  grantedByUser: AssignmentUserSummary | null;
};

type GroupAssignmentRecord = {
  id: string;
  scopeType: string;
  scopeId: string;
  createdAt: Date;
  expiresAt: Date | null;
  role: {
    roleName: string;
  };
  group: {
    groupName: string;
    isActive: boolean;
  };
  grantedByUser: AssignmentUserSummary | null;
};

type AssignmentUserOption = {
  id: string;
  username: string | null;
  email: string | null;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
};

type AssignmentRoleOption = {
  id: string;
  roleName: string;
};

export const dynamic = "force-dynamic";

export default async function AdminSecurityAssignmentsPage() {
  const currentUser = await requireAnyAdminPermission(["users.view", "roles.view"]);
  let accessGroupsAvailable = true;
  let visibleUsersWhere = getVisibleUsersWhere(currentUser);
  let userAssignments: UserAssignmentRecord[] = [];
  let groupAssignments: GroupAssignmentRecord[] = [];
  let userAssignmentCount = 0;
  let groupAssignmentCount = 0;
  let users: AssignmentUserOption[] = [];
  let roles: AssignmentRoleOption[] = [];

  try {
    [userAssignments, groupAssignments, userAssignmentCount, groupAssignmentCount, users, roles] =
      await Promise.all([
        prisma.userRoleAssignment.findMany({
          orderBy: [{ createdAt: "desc" }],
          where: {
            user: visibleUsersWhere,
          },
          select: {
            id: true,
            scopeType: true,
            scopeId: true,
            createdAt: true,
            expiresAt: true,
            role: {
              select: {
                roleName: true,
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
        prisma.accessGroupRoleAssignment.findMany({
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            scopeType: true,
            scopeId: true,
            createdAt: true,
            expiresAt: true,
            role: {
              select: {
                roleName: true,
              },
            },
            group: {
              select: {
                groupName: true,
                isActive: true,
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
        prisma.userRoleAssignment.count({
          where: {
            user: visibleUsersWhere,
          },
        }),
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

    [userAssignments, userAssignmentCount, users, roles] = await Promise.all([
      prisma.userRoleAssignment.findMany({
        orderBy: [{ createdAt: "desc" }],
        where: {
          user: visibleUsersWhere,
        },
        select: {
          id: true,
          scopeType: true,
          scopeId: true,
          createdAt: true,
          expiresAt: true,
          role: {
            select: {
              roleName: true,
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
      prisma.userRoleAssignment.count({
        where: {
          user: visibleUsersWhere,
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
      prisma.role.findMany({
        orderBy: [{ isSystemRole: "desc" }, { roleName: "asc" }],
        select: {
          id: true,
          roleName: true,
        },
      }),
    ]);

    groupAssignments = [];
    groupAssignmentCount = 0;
  }

  const assignmentCount = userAssignmentCount + groupAssignmentCount;
  const expiringGrantCount =
    userAssignments.filter((assignment) => assignment.expiresAt).length +
    groupAssignments.filter((assignment) => assignment.expiresAt).length;

  return (
    <div className="admin-security-stack">
      <SecurityMetricCards
        metrics={[
          {
            label: "Assignments",
            value: assignmentCount,
            hint: "Direct and group-based grants currently active in the access model.",
          },
          {
            label: "User Grants",
            value: userAssignmentCount,
            hint: "Direct role assignments attached to individual users.",
          },
          {
            label: "Group Grants",
            value: groupAssignmentCount,
            hint: "Role assignments attached to access groups for inherited access.",
          },
          {
            label: "Expiring Grants",
            value: expiringGrantCount,
            hint: "Assignments with a bounded lifetime already configured.",
          },
        ]}
      />

      <AssignmentsManager
        userAssignments={userAssignments.map((assignment) => ({
          id: assignment.id,
          userLabel: formatUserDisplayName(assignment.user),
          roleName: assignment.role.roleName,
          scopeLabel: formatScope(assignment.scopeType, assignment.scopeId),
          grantedByLabel: assignment.grantedByUser
            ? formatUserDisplayName(assignment.grantedByUser)
            : "System",
          createdAtLabel: formatDateTime(assignment.createdAt),
          expiresAtLabel: formatDate(assignment.expiresAt),
        }))}
        groupAssignments={groupAssignments.map((assignment) => ({
          id: assignment.id,
          groupLabel: assignment.group.groupName,
          roleName: assignment.role.roleName,
          scopeLabel: formatScope(assignment.scopeType, assignment.scopeId),
          grantedByLabel: assignment.grantedByUser
            ? formatUserDisplayName(assignment.grantedByUser)
            : "System",
          createdAtLabel: formatDateTime(assignment.createdAt),
          expiresAtLabel: formatDate(assignment.expiresAt),
        }))}
        users={users.map((user) => ({
          id: user.id,
          label: formatUserDisplayName(user),
        }))}
        roles={roles}
        canManage={
          currentUser.permissions.includes("users.edit") &&
          currentUser.permissions.includes("roles.manage")
        }
      />

      {!accessGroupsAvailable ? (
        <section className="admin-security-panel admin-table-card">
          <div className="admin-security-panel-header">
            <div>
              <p className="admin-security-kicker">Migration Required</p>
              <h2>Group Assignments Hidden</h2>
              <p>
                Direct user grants are available. Group-based inherited grants will appear
                once the access-group migration is applied to this database.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}