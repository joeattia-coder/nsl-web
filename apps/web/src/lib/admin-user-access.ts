import type { CurrentAdminUserSummary } from "@/lib/admin-auth-types";
import type { Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaNamespace } from "@/generated/prisma/client";

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
    {
      accessGroupMemberships: {
        some: {
          group: {
            is: {
              isActive: true,
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
          },
        },
      },
    },
  ],
};

const legacyGlobalAdminUserWhere: Prisma.UserWhereInput = {
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

export function isAccessGroupTablesMissingError(error: unknown) {
  if (!(error instanceof PrismaNamespace.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2021") {
    return false;
  }

  const message = `${error.message} ${JSON.stringify(error.meta ?? {})}`;
  return (
    message.includes("AccessGroupMembership") ||
    message.includes("AccessGroupRoleAssignment") ||
    message.includes("AccessGroup")
  );
}

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

type AccessGroupRoleAssignmentLike = {
  scopeType: string;
  scopeId: string;
  role: {
    roleKey: string;
  };
};

type AccessGroupMembershipLike = {
  group: {
    isActive?: boolean;
    roleAssignments?: AccessGroupRoleAssignmentLike[];
  };
};

export function isGlobalAdminUserRecord(user: {
  roleAssignments?: UserRoleAssignmentLike[];
  userRoles?: UserRoleLike[];
  accessGroupMemberships?: AccessGroupMembershipLike[];
}) {
  return Boolean(
    user.roleAssignments?.some(
      (assignment) =>
        assignment.scopeType === "GLOBAL" &&
        assignment.scopeId === "" &&
        assignment.role.roleKey === GLOBAL_ADMIN_ROLE_KEY
    ) ||
      user.userRoles?.some((userRole) => userRole.role.roleKey === GLOBAL_ADMIN_ROLE_KEY) ||
      user.accessGroupMemberships?.some(
        (membership) =>
          membership.group.isActive !== false &&
          membership.group.roleAssignments?.some(
            (assignment) =>
              assignment.scopeType === "GLOBAL" &&
              assignment.scopeId === "" &&
              assignment.role.roleKey === GLOBAL_ADMIN_ROLE_KEY
          )
      )
  );
}

export function isGlobalAdminSummary(currentUser: CurrentAdminUserSummary | null) {
  return Boolean(currentUser?.isGlobalAdmin);
}

export function getVisibleUsersWhere(
  currentUser: CurrentAdminUserSummary,
  options?: { includeAccessGroups?: boolean }
): Prisma.UserWhereInput {
  if (currentUser.isGlobalAdmin) {
    return {};
  }

  return {
    NOT: options?.includeAccessGroups === false
      ? legacyGlobalAdminUserWhere
      : globalAdminUserWhere,
  };
}

export function canManageGlobalAdminAccounts(currentUser: CurrentAdminUserSummary) {
  return currentUser.isGlobalAdmin;
}