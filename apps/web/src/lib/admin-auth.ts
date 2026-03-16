import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { CurrentAdminUserSummary } from "@/lib/admin-auth-types";
import { isGlobalAdminUserRecord } from "@/lib/admin-user-access";

const ADMIN_SESSION_COOKIE = "nsl_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const currentAdminSelect = {
  id: true,
  email: true,
  normalizedEmail: true,
  username: true,
  player: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
    },
  },
  roleAssignments: {
    select: {
      scopeType: true,
      scopeId: true,
      role: {
        select: {
          roleKey: true,
          rolePermissions: {
            select: {
              permission: {
                select: {
                  permissionKey: true,
                },
              },
            },
          },
        },
      },
    },
  },
  userRoles: {
    select: {
      role: {
        select: {
          roleKey: true,
          rolePermissions: {
            select: {
              permission: {
                select: {
                  permissionKey: true,
                },
              },
            },
          },
        },
      },
    },
  },
  permissionOverrides: {
    select: {
      scopeType: true,
      scopeId: true,
      effect: true,
      permission: {
        select: {
          permissionKey: true,
        },
      },
    },
  },
} as const;

type LoadedAdminUser = Awaited<ReturnType<typeof loadAdminUserById>>;

function getSessionSecret() {
  return (
    process.env.AUTH_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.VERCEL_OIDC_TOKEN ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    "development-admin-session-secret"
  );
}

function signSessionPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function encodeSessionValue(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
    })
  ).toString("base64url");
  const signature = signSessionPayload(payload);
  return `${payload}.${signature}`;
}

function decodeSessionValue(sessionValue: string | undefined) {
  if (!sessionValue) {
    return null;
  }

  const [payload, signature] = sessionValue.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(payload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      exp?: number;
    };

    if (!parsed.userId || !parsed.exp || parsed.exp <= Date.now()) {
      return null;
    }

    return parsed.userId;
  } catch {
    return null;
  }
}

function buildDisplayName(user: NonNullable<LoadedAdminUser>) {
  if (user.player) {
    return [user.player.firstName, user.player.middleInitial, user.player.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return user.username ?? user.email ?? "Administrator";
}

function resolvePermissions(user: NonNullable<LoadedAdminUser>) {
  const resolved = new Set<string>();

  for (const assignment of user.roleAssignments) {
    if (assignment.scopeType !== "GLOBAL") {
      continue;
    }

    for (const rolePermission of assignment.role.rolePermissions) {
      resolved.add(rolePermission.permission.permissionKey);
    }
  }

  for (const userRole of user.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      resolved.add(rolePermission.permission.permissionKey);
    }
  }

  for (const override of user.permissionOverrides) {
    if (override.scopeType !== "GLOBAL") {
      continue;
    }

    const permissionKey = override.permission.permissionKey;

    if (override.effect === "ALLOW") {
      resolved.add(permissionKey);
      continue;
    }

    resolved.delete(permissionKey);
  }

  return Array.from(resolved).sort();
}

async function loadAdminUserById(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: currentAdminSelect,
  });
}

async function findCurrentAdminCandidate() {
  const cookieStore = await cookies();
  const sessionUserId = decodeSessionValue(cookieStore.get(ADMIN_SESSION_COOKIE)?.value?.trim());

  if (sessionUserId) {
    const cookieUser = await loadAdminUserById(sessionUserId);

    if (
      cookieUser &&
      (cookieUser.roleAssignments.some(
        (assignment) =>
          assignment.scopeType === "GLOBAL" && assignment.scopeId === "" && assignment.role.roleKey === "ADMINISTRATOR"
      ) ||
        cookieUser.userRoles.some((userRole) => userRole.role.roleKey === "ADMINISTRATOR"))
    ) {
      return {
        user: cookieUser,
        source: "session" as const,
      };
    }
  }

  return null;
}

export async function resolveCurrentAdminUser(): Promise<CurrentAdminUserSummary | null> {
  const candidate = await findCurrentAdminCandidate();

  if (!candidate) {
    return null;
  }

  return {
    id: candidate.user.id,
    email: candidate.user.email,
    username: candidate.user.username,
    displayName: buildDisplayName(candidate.user),
    linkedPlayerId: candidate.user.player?.id ?? null,
    isGlobalAdmin: isGlobalAdminUserRecord(candidate.user),
    permissions: resolvePermissions(candidate.user),
    source: candidate.source,
  };
}

export async function findAdminUserForLogin(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      AND: [
        { isLoginEnabled: true },
        {
          OR: [
            { email: normalized },
            { normalizedEmail: normalized },
            { username: normalized },
            { normalizedUsername: normalized },
          ],
        },
        {
          OR: [
            {
              roleAssignments: {
                some: {
                  scopeType: "GLOBAL",
                  scopeId: "",
                  role: { roleKey: "ADMINISTRATOR" },
                },
              },
            },
            {
              userRoles: {
                some: {
                  role: { roleKey: "ADMINISTRATOR" },
                },
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      passwordHash: true,
      isLoginEnabled: true,
    },
  });
}

export function buildAdminSessionCookieValue(userId: string) {
  return encodeSessionValue(userId);
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}

export function hasAdminPermission(
  currentUser: CurrentAdminUserSummary | null,
  permission: string
) {
  if (!currentUser) {
    return false;
  }

  return currentUser.permissions.includes(permission);
}

export async function requireAdminPermission(permission: string) {
  const currentUser = await resolveCurrentAdminUser();

  if (!currentUser) {
    redirect("/");
  }

  if (!hasAdminPermission(currentUser, permission)) {
    redirect("/admin");
  }

  return currentUser;
}

export async function requireAnyAdminPermission(permissions: string[]) {
  const currentUser = await resolveCurrentAdminUser();

  if (!currentUser) {
    redirect("/");
  }

  if (!permissions.some((permission) => hasAdminPermission(currentUser, permission))) {
    redirect("/admin");
  }

  return currentUser;
}