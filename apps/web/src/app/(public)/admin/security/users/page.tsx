import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getVisibleUsersWhere, isGlobalAdminUserRecord } from "@/lib/admin-user-access";
import SecurityMetricCards from "../SecurityMetricCards";
import UsersTable from "./users-table";
import {
  compactList,
  formatDate,
  formatDateTime,
  formatUserDisplayName,
} from "../security-utils";

export const dynamic = "force-dynamic";

export default async function AdminSecurityUsersPage() {
  const currentUser = await requireAdminPermission("users.view");
  const visibleUsersWhere = getVisibleUsersWhere(currentUser);

  const [users, userCount, linkedPlayerCount, enabledLoginCount, pendingInvites] =
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