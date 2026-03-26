import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  AdminPermissionGrant,
  AdminPermissionOverride,
  AdminPermissionScope,
  AdminPermissionScopeType,
  CurrentAdminUserSummary,
} from "@/lib/admin-auth-types";
import { isGlobalAdminUserRecord } from "@/lib/admin-user-access";

const ADMIN_SESSION_COOKIE = "nsl_admin_session";
const ADMIN_SESSION_HEADER = "x-nsl-session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const GLOBAL_ADMIN_ROLE_KEY = "ADMINISTRATOR";
const PLAYER_ROLE_KEY = "PLAYER";
const GLOBAL_SCOPE: AdminPermissionScope = { scopeType: "GLOBAL", scopeId: "" };
const ACTIVE_PLAYER_TOURNAMENT_STATUSES = [
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
] as const;

const currentAdminSelect = {
  id: true,
  email: true,
  normalizedEmail: true,
  username: true,
  isLoginEnabled: true,
  player: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      entryMembers: {
        select: {
          tournamentEntry: {
            select: {
              tournament: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  },
  roleAssignments: {
    select: {
      scopeType: true,
      scopeId: true,
      expiresAt: true,
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
  accessGroupMemberships: {
    select: {
      group: {
        select: {
          id: true,
          groupName: true,
          isActive: true,
          roleAssignments: {
            select: {
              scopeType: true,
              scopeId: true,
              expiresAt: true,
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
        },
      },
    },
  },
  permissionOverrides: {
    select: {
      scopeType: true,
      scopeId: true,
      expiresAt: true,
      effect: true,
      permission: {
        select: {
          permissionKey: true,
        },
      },
    },
  },
} as const;

const legacyCurrentAdminSelect = {
  id: true,
  email: true,
  normalizedEmail: true,
  username: true,
  isLoginEnabled: true,
  player: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      entryMembers: {
        select: {
          tournamentEntry: {
            select: {
              tournament: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  },
  roleAssignments: {
    select: {
      scopeType: true,
      scopeId: true,
      expiresAt: true,
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
      expiresAt: true,
      effect: true,
      permission: {
        select: {
          permissionKey: true,
        },
      },
    },
  },
} as const;

const loginUserSelect = {
  id: true,
  email: true,
  normalizedEmail: true,
  username: true,
  passwordHash: true,
  isLoginEnabled: true,
  player: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      entryMembers: {
        select: {
          tournamentEntry: {
            select: {
              tournament: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  },
  roleAssignments: {
    select: {
      scopeType: true,
      scopeId: true,
      expiresAt: true,
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
  accessGroupMemberships: {
    select: {
      group: {
        select: {
          isActive: true,
          roleAssignments: {
            select: {
              scopeType: true,
              scopeId: true,
              expiresAt: true,
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
        },
      },
    },
  },
  permissionOverrides: {
    select: {
      scopeType: true,
      scopeId: true,
      expiresAt: true,
      effect: true,
      permission: {
        select: {
          permissionKey: true,
        },
      },
    },
  },
} as const;

const legacyLoginUserSelect = {
  id: true,
  email: true,
  normalizedEmail: true,
  username: true,
  passwordHash: true,
  isLoginEnabled: true,
  player: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      entryMembers: {
        select: {
          tournamentEntry: {
            select: {
              tournament: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  },
  roleAssignments: {
    select: {
      scopeType: true,
      scopeId: true,
      expiresAt: true,
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
      expiresAt: true,
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

function isAccessGroupTablesMissingError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
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

function hasGlobalRoleKey(
  entries: Array<{
    scopeType?: string;
    scopeId?: string;
    expiresAt?: Date | null;
    role: { roleKey: string };
  }>,
  roleKey: string,
  requireGlobalScope: boolean
) {
  return entries.some((entry) => {
    if (entry.expiresAt && entry.expiresAt <= new Date()) {
      return false;
    }

    if (entry.role.roleKey !== roleKey) {
      return false;
    }

    if (!requireGlobalScope) {
      return true;
    }

    return entry.scopeType === "GLOBAL" && (entry.scopeId ?? "") === "";
  });
}

function hasRoleKey(user: NonNullable<LoadedAdminUser>, roleKey: string, requireGlobalScope = false) {
  if (hasGlobalRoleKey(user.roleAssignments, roleKey, requireGlobalScope)) {
    return true;
  }

  if (hasGlobalRoleKey(user.userRoles, roleKey, false)) {
    return true;
  }

  return user.accessGroupMemberships.some((membership) => {
    if (!membership.group.isActive) {
      return false;
    }

    return hasGlobalRoleKey(membership.group.roleAssignments, roleKey, requireGlobalScope);
  });
}

function normalizeScope(
  scopeType: string | AdminPermissionScopeType | null | undefined,
  scopeId: string | null | undefined
): AdminPermissionScope {
  const normalizedScopeType = String(scopeType ?? "GLOBAL").trim().toUpperCase() as AdminPermissionScopeType;

  return {
    scopeType: normalizedScopeType,
    scopeId: normalizedScopeType === "GLOBAL" ? "" : String(scopeId ?? "").trim(),
  };
}

function scopeKey(scope: AdminPermissionScope) {
  return `${scope.scopeType}:${scope.scopeId}`;
}

function uniqueScopes(scopes: AdminPermissionScope[]) {
  return Array.from(new Map(scopes.map((scope) => [scopeKey(scope), scope])).values());
}

function isActiveAt(expiresAt: Date | null | undefined) {
  return !expiresAt || expiresAt > new Date();
}

function buildPermissionGrants(user: NonNullable<LoadedAdminUser>): AdminPermissionGrant[] {
  const grants: AdminPermissionGrant[] = [];

  for (const assignment of user.roleAssignments) {
    if (!isActiveAt(assignment.expiresAt)) {
      continue;
    }

    const scope = normalizeScope(assignment.scopeType, assignment.scopeId);

    for (const rolePermission of assignment.role.rolePermissions) {
      grants.push({
        permissionKey: rolePermission.permission.permissionKey,
        ...scope,
      });
    }
  }

  for (const userRole of user.userRoles) {
    for (const rolePermission of userRole.role.rolePermissions) {
      grants.push({
        permissionKey: rolePermission.permission.permissionKey,
        ...GLOBAL_SCOPE,
      });
    }
  }

  for (const membership of user.accessGroupMemberships) {
    if (!membership.group.isActive) {
      continue;
    }

    for (const assignment of membership.group.roleAssignments) {
      if (!isActiveAt(assignment.expiresAt)) {
        continue;
      }

      const scope = normalizeScope(assignment.scopeType, assignment.scopeId);

      for (const rolePermission of assignment.role.rolePermissions) {
        grants.push({
          permissionKey: rolePermission.permission.permissionKey,
          ...scope,
        });
      }
    }
  }

  return Array.from(
    new Map(grants.map((grant) => [`${grant.permissionKey}|${scopeKey(grant)}`, grant])).values()
  );
}

function buildPermissionOverrides(user: NonNullable<LoadedAdminUser>): AdminPermissionOverride[] {
  return user.permissionOverrides
    .filter((override) => isActiveAt(override.expiresAt))
    .map((override) => ({
      permissionKey: override.permission.permissionKey,
      effect: override.effect,
      ...normalizeScope(override.scopeType, override.scopeId),
    }));
}

function isAdminPermissionKey(permissionKey: string) {
  return !permissionKey.startsWith("profile.self.") && !permissionKey.startsWith("account.self.");
}

function hasAnyAdminCapability(user: NonNullable<LoadedAdminUser>) {
  if (hasRoleKey(user, GLOBAL_ADMIN_ROLE_KEY, true)) {
    return true;
  }

  return (
    buildPermissionGrants(user).some((grant) => isAdminPermissionKey(grant.permissionKey)) ||
    buildPermissionOverrides(user).some(
      (override) =>
        override.effect === "ALLOW" && isAdminPermissionKey(override.permissionKey)
    )
  );
}

function evaluatePermission(
  permissionKey: string,
  scopes: AdminPermissionScope[],
  grants: AdminPermissionGrant[],
  overrides: AdminPermissionOverride[]
) {
  const normalizedScopes = uniqueScopes(scopes);

  for (const scope of normalizedScopes) {
    const override = overrides.find(
      (candidate) =>
        candidate.permissionKey === permissionKey &&
        candidate.scopeType === scope.scopeType &&
        candidate.scopeId === scope.scopeId
    );

    if (override) {
      return override.effect === "ALLOW";
    }
  }

  return normalizedScopes.some((scope) =>
    grants.some(
      (grant) =>
        grant.permissionKey === permissionKey &&
        grant.scopeType === scope.scopeType &&
        grant.scopeId === scope.scopeId
    )
  );
}

export function buildGlobalAdminPermissionScopes() {
  return [GLOBAL_SCOPE];
}

export function buildLeagueAdminPermissionScopes(leagueId: string) {
  return uniqueScopes([normalizeScope("LEAGUE", leagueId), GLOBAL_SCOPE]);
}

export function buildSeasonAdminPermissionScopes(seasonId: string, leagueId?: string | null) {
  return uniqueScopes([
    normalizeScope("SEASON", seasonId),
    ...(leagueId ? [normalizeScope("LEAGUE", leagueId)] : []),
    GLOBAL_SCOPE,
  ]);
}

export function buildTournamentAdminPermissionScopes(
  tournamentId: string,
  seasonId?: string | null,
  leagueId?: string | null
) {
  return uniqueScopes([
    normalizeScope("TOURNAMENT", tournamentId),
    ...(seasonId ? [normalizeScope("SEASON", seasonId)] : []),
    ...(leagueId ? [normalizeScope("LEAGUE", leagueId)] : []),
    GLOBAL_SCOPE,
  ]);
}

export async function getSeasonAdminPermissionScopes(seasonId: string) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: {
      id: true,
      leagueId: true,
    },
  });

  if (!season) {
    return null;
  }

  return buildSeasonAdminPermissionScopes(season.id, season.leagueId);
}

export async function getTournamentAdminPermissionScopes(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      seasonId: true,
      season: {
        select: {
          leagueId: true,
        },
      },
    },
  });

  if (!tournament) {
    return null;
  }

  return buildTournamentAdminPermissionScopes(
    tournament.id,
    tournament.seasonId,
    tournament.season.leagueId
  );
}

export async function getStageAdminPermissionScopes(stageId: string) {
  const stage = await prisma.tournamentStage.findUnique({
    where: { id: stageId },
    select: {
      id: true,
      tournament: {
        select: {
          id: true,
          seasonId: true,
          season: {
            select: {
              leagueId: true,
            },
          },
        },
      },
    },
  });

  if (!stage) {
    return null;
  }

  return buildTournamentAdminPermissionScopes(
    stage.tournament.id,
    stage.tournament.seasonId,
    stage.tournament.season.leagueId
  );
}

export async function getRoundAdminPermissionScopes(roundId: string) {
  const round = await prisma.stageRound.findUnique({
    where: { id: roundId },
    select: {
      id: true,
      tournamentStage: {
        select: {
          tournament: {
            select: {
              id: true,
              seasonId: true,
              season: {
                select: {
                  leagueId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!round) {
    return null;
  }

  return buildTournamentAdminPermissionScopes(
    round.tournamentStage.tournament.id,
    round.tournamentStage.tournament.seasonId,
    round.tournamentStage.tournament.season.leagueId
  );
}

export async function getGroupAdminPermissionScopes(groupId: string) {
  const group = await prisma.tournamentGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      stageRound: {
        select: {
          tournamentStage: {
            select: {
              tournament: {
                select: {
                  id: true,
                  seasonId: true,
                  season: {
                    select: {
                      leagueId: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  return buildTournamentAdminPermissionScopes(
    group.stageRound.tournamentStage.tournament.id,
    group.stageRound.tournamentStage.tournament.seasonId,
    group.stageRound.tournamentStage.tournament.season.leagueId
  );
}

export async function getMatchAdminPermissionScopes(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      tournament: {
        select: {
          id: true,
          seasonId: true,
          season: {
            select: {
              leagueId: true,
            },
          },
        },
      },
    },
  });

  if (!match) {
    return null;
  }

  return buildTournamentAdminPermissionScopes(
    match.tournament.id,
    match.tournament.seasonId,
    match.tournament.season.leagueId
  );
}

function resolvePermissions(user: NonNullable<LoadedAdminUser>) {
  const grants = buildPermissionGrants(user);
  const overrides = buildPermissionOverrides(user);
  const permissionKeys = Array.from(
    new Set([
      ...grants.map((grant) => grant.permissionKey),
      ...overrides.map((override) => override.permissionKey),
    ])
  );

  return permissionKeys
    .filter((permissionKey) => evaluatePermission(permissionKey, [GLOBAL_SCOPE], grants, overrides))
    .sort();
}

async function loadAdminUserById(userId: string) {
  try {
    return await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: currentAdminSelect,
    });
  } catch (error) {
    if (!isAccessGroupTablesMissingError(error)) {
      throw error;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: legacyCurrentAdminSelect,
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      accessGroupMemberships: [],
    };
  }
}

async function loadLoginUser(where: Prisma.UserWhereInput) {
  return prisma.user.findFirst({
    where,
    select: loginUserSelect,
  });
}

async function loadLegacyLoginUser(where: Prisma.UserWhereInput) {
  const user = await prisma.user.findFirst({
    where,
    select: legacyLoginUserSelect,
  });

  return user
    ? {
        ...user,
        accessGroupMemberships: [],
      }
    : null;
}

async function findCurrentAdminCandidate() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const sessionToken =
    requestHeaders.get(ADMIN_SESSION_HEADER)?.trim() ||
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value?.trim() ||
    "";
  const sessionUserId = decodeSessionValue(sessionToken);

  if (sessionUserId) {
    const cookieUser = await loadAdminUserById(sessionUserId);

    if (cookieUser && cookieUser.isLoginEnabled) {
      return {
        user: cookieUser,
        source: "session" as const,
      };
    }
  }

  return null;
}

function isAdminUserRecord(user: NonNullable<LoadedAdminUser>) {
  return hasAnyAdminCapability(user);
}

function hasActiveTournamentRegistration(user: NonNullable<LoadedAdminUser>) {
  return (
    user.player?.entryMembers.some((entryMember) => {
      const tournamentStatus = entryMember.tournamentEntry.tournament.status;

      return ACTIVE_PLAYER_TOURNAMENT_STATUSES.some((status) => status === tournamentStatus);
    }) ?? false
  );
}

function isPlayerUserRecord(user: NonNullable<LoadedAdminUser>) {
  return hasRoleKey(user, PLAYER_ROLE_KEY, true) || hasActiveTournamentRegistration(user);
}

function resolveNextPath(nextPath: string | null | undefined, isAdmin: boolean, hasLinkedPlayer: boolean) {
  if (nextPath && nextPath.startsWith("/")) {
    return nextPath;
  }

  if (isAdmin) {
    return "/admin";
  }

  return hasLinkedPlayer ? "/dashboard" : "/profile";
}

export async function resolveCurrentUser(): Promise<CurrentAdminUserSummary | null> {
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
    isAdmin: isAdminUserRecord(candidate.user),
    isPlayer: isPlayerUserRecord(candidate.user),
    permissions: resolvePermissions(candidate.user),
    permissionGrants: buildPermissionGrants(candidate.user),
    permissionOverrides: buildPermissionOverrides(candidate.user),
    source: candidate.source,
  };
}

export async function resolveCurrentAdminUser(): Promise<CurrentAdminUserSummary | null> {
  const currentUser = await resolveCurrentUser();

  if (!currentUser?.isAdmin) {
    return null;
  }

  return currentUser;
}

export async function findUserForLogin(identifier: string) {
  const normalized = identifier.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const where = {
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
    ],
  };

  let user;

  try {
    user = await loadLoginUser(where);
  } catch (error) {
    if (!isAccessGroupTablesMissingError(error)) {
      throw error;
    }

    user = await loadLegacyLoginUser(where);
  }

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    passwordHash: user.passwordHash,
    isLoginEnabled: user.isLoginEnabled,
    linkedPlayerId: user.player?.id ?? null,
    isAdmin: hasAnyAdminCapability(user),
  };
}

export async function findAdminUserForLogin(identifier: string) {
  const user = await findUserForLogin(identifier);

  if (!user?.isAdmin) {
    return null;
  }

  return user;
}

export function getLoginSuccessPath(
  isAdmin: boolean,
  nextPath: string | null | undefined,
  hasLinkedPlayer: boolean
) {
  return resolveNextPath(nextPath, isAdmin, hasLinkedPlayer);
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

export function getAdminSessionHeaderName() {
  return ADMIN_SESSION_HEADER;
}

export function hasAdminPermission(
  currentUser: CurrentAdminUserSummary | null,
  permission: string
) {
  return hasScopedAdminPermission(currentUser, permission, [GLOBAL_SCOPE]);
}

export function hasAnyAdminPermission(
  currentUser: CurrentAdminUserSummary | null,
  permission: string
) {
  if (!currentUser) {
    return false;
  }

  return (
    currentUser.permissions.includes(permission) ||
    currentUser.permissionGrants.some((grant) => grant.permissionKey === permission) ||
    currentUser.permissionOverrides.some(
      (override) => override.permissionKey === permission && override.effect === "ALLOW"
    )
  );
}

export function hasScopedAdminPermission(
  currentUser: CurrentAdminUserSummary | null,
  permission: string,
  scopes: AdminPermissionScope[]
) {
  if (!currentUser) {
    return false;
  }

  return evaluatePermission(
    permission,
    scopes,
    currentUser.permissionGrants,
    currentUser.permissionOverrides
  );
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

export async function requireAnyScopedAdminPermission(permission: string) {
  const currentUser = await resolveCurrentAdminUser();

  if (!currentUser) {
    redirect("/");
  }

  if (!hasAnyAdminPermission(currentUser, permission)) {
    redirect("/admin");
  }

  return currentUser;
}

export async function requireScopedAdminPermission(
  permission: string,
  scopes: AdminPermissionScope[]
) {
  const currentUser = await resolveCurrentAdminUser();

  if (!currentUser) {
    redirect("/");
  }

  if (!hasScopedAdminPermission(currentUser, permission, scopes)) {
    redirect("/admin");
  }

  return currentUser;
}