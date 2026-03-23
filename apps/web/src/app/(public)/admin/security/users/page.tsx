import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import {
  getVisibleUsersWhere,
  isAccessGroupTablesMissingError,
  isGlobalAdminUserRecord,
} from "@/lib/admin-user-access";
import SecurityMetricCards from "../SecurityMetricCards";
import UsersTable from "./users-table";
import {
  compactList,
  formatDate,
  formatDateTime,
  formatUserDisplayName,
} from "../security-utils";

type DirectoryUserSummary = {
  id: string;
  username: string | null;
  email: string | null;
  registrationStatus: string;
  isLoginEnabled: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
  authAccounts: Array<{
    provider: string;
  }>;
  roleAssignments: Array<{
    role: {
      roleKey: string;
      roleName: string;
    };
    scopeType: string;
    scopeId: string;
  }>;
  userRoles: Array<{
    role: {
      roleKey: string;
    };
  }>;
  accessGroupMemberships: Array<{
    group: {
      isActive: boolean;
      roleAssignments: Array<{
        scopeType: string;
        scopeId: string;
        role: {
          roleKey: string;
        };
      }>;
    };
  }>;
  _count: {
    targetInvitations: number;
    permissionOverrides: number;
  };
};

export const dynamic = "force-dynamic";

export default async function AdminSecurityUsersPage() {
  const currentUser = await requireAdminPermission("users.view");
  let accessGroupsAvailable = true;
  let visibleUsersWhere = getVisibleUsersWhere(currentUser);
  let users: DirectoryUserSummary[] = [];
  let userCount = 0;
  let linkedPlayerCount = 0;
  let enabledLoginCount = 0;
  let pendingInvites = 0;

  try {
    [users, userCount, linkedPlayerCount, enabledLoginCount, pendingInvites] =
      await Promise.all([
        prisma.user.findMany({
          where: visibleUsersWhere,
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            username: true,
            email: true,
            registrationStatus: true,
            isLoginEnabled: true,
            emailVerifiedAt: true,
            createdAt: true,
            player: {
              select: {
                firstName: true,
                middleInitial: true,
                lastName: true,
              },
            },
            authAccounts: {
              select: {
                provider: true,
              },
            },
            roleAssignments: {
              select: {
                role: {
                  select: {
                    roleKey: true,
                    roleName: true,
                  },
                },
                scopeType: true,
                scopeId: true,
              },
            },
            userRoles: {
              select: {
                role: {
                  select: {
                    roleKey: true,
                  },
                },
              },
            },
            accessGroupMemberships: {
              select: {
                group: {
                  select: {
                    isActive: true,
                    roleAssignments: {
                      select: {
                        scopeType: true,
                        scopeId: true,
                        role: {
                          select: {
                            roleKey: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                targetInvitations: true,
                permissionOverrides: true,
              },
            },
          },
        }),
        prisma.user.count({ where: visibleUsersWhere }),
        prisma.user.count({ where: { ...visibleUsersWhere, player: { isNot: null } } }),
        prisma.user.count({ where: { ...visibleUsersWhere, isLoginEnabled: true } }),
        prisma.invitation.count({ where: { status: "PENDING" } }),
      ]);
  } catch (error) {
    if (!isAccessGroupTablesMissingError(error)) {
      throw error;
    }

    accessGroupsAvailable = false;
    visibleUsersWhere = getVisibleUsersWhere(currentUser, { includeAccessGroups: false });

    const [legacyUsers, nextUserCount, nextLinkedPlayerCount, nextEnabledLoginCount, nextPendingInvites] =
      await Promise.all([
        prisma.user.findMany({
          where: visibleUsersWhere,
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            username: true,
            email: true,
            registrationStatus: true,
            isLoginEnabled: true,
            emailVerifiedAt: true,
            createdAt: true,
            player: {
              select: {
                firstName: true,
                middleInitial: true,
                lastName: true,
              },
            },
            authAccounts: {
              select: {
                provider: true,
              },
            },
            roleAssignments: {
              select: {
                role: {
                  select: {
                    roleKey: true,
                    roleName: true,
                  },
                },
                scopeType: true,
                scopeId: true,
              },
            },
            userRoles: {
              select: {
                role: {
                  select: {
                    roleKey: true,
                  },
                },
              },
            },
            _count: {
              select: {
                targetInvitations: true,
                permissionOverrides: true,
              },
            },
          },
        }),
        prisma.user.count({ where: visibleUsersWhere }),
        prisma.user.count({ where: { ...visibleUsersWhere, player: { isNot: null } } }),
        prisma.user.count({ where: { ...visibleUsersWhere, isLoginEnabled: true } }),
        prisma.invitation.count({ where: { status: "PENDING" } }),
      ]);

    users = legacyUsers.map((user) => ({
      ...user,
      accessGroupMemberships: [],
    }));
    userCount = nextUserCount;
    linkedPlayerCount = nextLinkedPlayerCount;
    enabledLoginCount = nextEnabledLoginCount;
    pendingInvites = nextPendingInvites;
  }

  const userRows = users.map((user) => {
    const providerLabels = Array.from(
      new Set(user.authAccounts.map((account) => account.provider))
    );
    const assignmentLabels = user.roleAssignments.map(
      (assignment) =>
        assignment.scopeType === "GLOBAL"
          ? assignment.role.roleName
          : `${assignment.role.roleName} (${assignment.scopeType})`
    );

    return {
      id: user.id,
      displayName: formatUserDisplayName(user),
      username: user.username ?? "No username",
      email: user.email ?? "No email",
      registrationStatus: user.registrationStatus,
      isLoginEnabled: user.isLoginEnabled,
      emailVerified: Boolean(user.emailVerifiedAt),
      emailVerifiedLabel: user.emailVerifiedAt
        ? `Verified ${formatDate(user.emailVerifiedAt)}`
        : "Email unverified",
      providersLabel: compactList(providerLabels, "Local only"),
      assignedAccessLabel: compactList(assignmentLabels, "No scoped roles"),
      invitesCount: user._count.targetInvitations,
      overridesCount: user._count.permissionOverrides,
      createdAtLabel: formatDateTime(user.createdAt),
      isGlobalAdmin: isGlobalAdminUserRecord(user),
    };
  });

  return (
    <div className="admin-security-stack">
      <SecurityMetricCards
        metrics={[
          {
            label: "Users",
            value: userCount,
            hint: "All user identities currently stored in the platform.",
          },
          {
            label: "Login Enabled",
            value: enabledLoginCount,
            hint: "Accounts that are currently allowed to authenticate.",
          },
          {
            label: "Linked Players",
            value: linkedPlayerCount,
            hint: "User records already connected to player profiles.",
          },
          {
            label: "Pending Invites",
            value: pendingInvites,
            hint: "Onboarding invitations waiting to be accepted or expire.",
          },
        ]}
      />

      <section className="admin-security-panel admin-table-card">
        <div className="admin-security-panel-header">
          <div>
            <p className="admin-security-kicker">Users</p>
            <h2>User Directory</h2>
            <p>
              Manage identities, linked profiles, auth providers, and assigned
              access. Global admin accounts are only visible to global admins.
            </p>
            {!accessGroupsAvailable ? (
              <p>
                Access groups are unavailable on this database until the additive
                security migration is applied. This view is using legacy-safe data.
              </p>
            ) : null}
          </div>
        </div>

        <UsersTable
          users={userRows}
          canCreate={currentUser.permissions.includes("users.create")}
          canEdit={currentUser.permissions.includes("users.edit")}
          canDelete={currentUser.permissions.includes("users.disable")}
          currentUserId={currentUser.id}
        />
      </section>
    </div>
  );
}