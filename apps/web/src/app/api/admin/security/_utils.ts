import { GLOBAL_ADMIN_ROLE_KEY, getVisibleUsersWhere } from "@/lib/admin-user-access";
import { prisma } from "@/lib/prisma";
import type { CurrentAdminUserSummary } from "@/lib/admin-auth-types";

export function parseOptionalString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

export function parseRequiredString(value: unknown, fieldName: string) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

export function parseScopeValue(scopeType: unknown, scopeId: unknown) {
  const normalizedScopeType = String(scopeType ?? "GLOBAL").trim().toUpperCase();
  const normalizedScopeId = String(scopeId ?? "").trim();

  return {
    scopeType: normalizedScopeType,
    scopeId: normalizedScopeType === "GLOBAL" ? "" : normalizedScopeId,
  };
}

export function parseOptionalDate(value: unknown) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date value.");
  }

  return parsed;
}

export async function loadVisibleUsers(
  currentUser: CurrentAdminUserSummary,
  userIds: string[]
) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueUserIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: uniqueUserIds },
      ...getVisibleUsersWhere(currentUser),
    },
    select: {
      id: true,
    },
  });

  return users;
}

export async function loadRoles(roleIds: string[]) {
  const uniqueRoleIds = Array.from(new Set(roleIds.filter(Boolean)));

  if (uniqueRoleIds.length === 0) {
    return [];
  }

  return prisma.role.findMany({
    where: {
      id: { in: uniqueRoleIds },
    },
    select: {
      id: true,
      roleKey: true,
      isSystemRole: true,
    },
  });
}

export async function loadPermissions(permissionIds: string[]) {
  const uniquePermissionIds = Array.from(new Set(permissionIds.filter(Boolean)));

  if (uniquePermissionIds.length === 0) {
    return [];
  }

  return prisma.permission.findMany({
    where: {
      id: { in: uniquePermissionIds },
    },
    select: {
      id: true,
    },
  });
}

export function ensureAllFound(foundCount: number, expectedCount: number, entityLabel: string) {
  if (foundCount !== expectedCount) {
    throw new Error(`One or more selected ${entityLabel} could not be found.`);
  }
}

export function ensureCanManageGlobalAdminGrant(
  currentUser: CurrentAdminUserSummary,
  grants: Array<{ roleKey: string; scopeType: string; scopeId: string }>
) {
  if (currentUser.isGlobalAdmin) {
    return;
  }

  const includesGlobalAdminGrant = grants.some(
    (grant) =>
      grant.roleKey === GLOBAL_ADMIN_ROLE_KEY &&
      grant.scopeType === "GLOBAL" &&
      grant.scopeId === ""
  );

  if (includesGlobalAdminGrant) {
    throw new Error("Only global administrators can manage global administrator grants.");
  }
}