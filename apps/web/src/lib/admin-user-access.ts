import type { CurrentAdminUserSummary } from "@/lib/admin-auth-types";
import type { Prisma } from "@/generated/prisma/client";

export const GLOBAL_ADMIN_ROLE_KEY = "ADMINISTRATOR";

export const globalAdminUserWhere: Prisma.UserWhereInput = {
  OR: [
    {
      roleAssignments: {
        some: {
          scopeType: "GLOBAL",
          scopeId: "",
          role: {
            roleKey: GLOBAL_ADMIN_ROLE_KEY,
          },
        },
      },
    },
    {
      userRoles: {
        some: {
          role: {
            roleKey: GLOBAL_ADMIN_ROLE_KEY,
          },
        },
      },
    },
  ],
};

type UserRoleAssignmentLike = {
  scopeType: string;
  scopeId: string;
  role: {
    roleKey: string;
  };
};

type UserRoleLike = {
  role: {
    roleKey: string;
  };
};

export function isGlobalAdminUserRecord(user: {
  roleAssignments?: UserRoleAssignmentLike[];
  userRoles?: UserRoleLike[];
}) {
  return Boolean(
    user.roleAssignments?.some(
      (assignment) =>
        assignment.scopeType === "GLOBAL" &&
        assignment.scopeId === "" &&
        assignment.role.roleKey === GLOBAL_ADMIN_ROLE_KEY
    ) ||
      user.userRoles?.some((userRole) => userRole.role.roleKey === GLOBAL_ADMIN_ROLE_KEY)
  );
}

export function isGlobalAdminSummary(currentUser: CurrentAdminUserSummary | null) {
  return Boolean(currentUser?.isGlobalAdmin);
}

export function getVisibleUsersWhere(currentUser: CurrentAdminUserSummary): Prisma.UserWhereInput {
  if (currentUser.isGlobalAdmin) {
    return {};
  }

  return {
    NOT: globalAdminUserWhere,
  };
}

export function canManageGlobalAdminAccounts(currentUser: CurrentAdminUserSummary) {
  return currentUser.isGlobalAdmin;
}