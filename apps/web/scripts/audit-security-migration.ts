import "dotenv/config";

import { prisma } from "../src/lib/prisma";

type UserNameLike = {
  username: string | null;
  email: string | null;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
};

function displayName(user: UserNameLike) {
  if (user.player) {
    return [user.player.firstName, user.player.middleInitial, user.player.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return user.username ?? user.email ?? "(unnamed)";
}

async function main() {
  const [roles, users, directAssignments, groups] = await Promise.all([
    prisma.role.findMany({
      orderBy: [{ roleName: "asc" }],
      select: {
        roleKey: true,
        roleName: true,
        isSystemRole: true,
        _count: {
          select: {
            userRoles: true,
            userRoleAssignments: true,
            accessGroupRoleAssignments: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [{ userRoles: { some: {} } }, { roleAssignments: { some: {} } }],
      },
      orderBy: [{ createdAt: "desc" }],
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
        userRoles: {
          select: {
            role: {
              select: {
                roleKey: true,
              },
            },
          },
        },
        roleAssignments: {
          select: {
            scopeType: true,
            scopeId: true,
            role: {
              select: {
                roleKey: true,
                roleName: true,
              },
            },
          },
        },
      },
    }),
    prisma.userRoleAssignment.findMany({
      orderBy: [{ role: { roleName: "asc" } }, { scopeType: "asc" }, { scopeId: "asc" }],
      select: {
        scopeType: true,
        scopeId: true,
        expiresAt: true,
        role: {
          select: {
            roleKey: true,
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
      },
    }),
    prisma.accessGroup.findMany({
      orderBy: [{ groupName: "asc" }],
      select: {
        groupName: true,
        isActive: true,
        _count: {
          select: {
            memberships: true,
            roleAssignments: true,
          },
        },
      },
    }),
  ]);

  const repeatedDirectCohorts = new Map<
    string,
    {
      roleKey: string;
      roleName: string;
      scopeType: string;
      scopeId: string;
      users: string[];
      expiringCount: number;
    }
  >();

  for (const assignment of directAssignments) {
    const key = [assignment.role.roleKey, assignment.scopeType, assignment.scopeId].join("|");
    const existing = repeatedDirectCohorts.get(key);
    const userLabel = displayName(assignment.user);

    if (existing) {
      existing.users.push(userLabel);
      if (assignment.expiresAt) {
        existing.expiringCount += 1;
      }
      continue;
    }

    repeatedDirectCohorts.set(key, {
      roleKey: assignment.role.roleKey,
      roleName: assignment.role.roleName,
      scopeType: assignment.scopeType,
      scopeId: assignment.scopeId,
      users: [userLabel],
      expiringCount: assignment.expiresAt ? 1 : 0,
    });
  }

  const candidateCohorts = Array.from(repeatedDirectCohorts.values())
    .filter((cohort) => cohort.users.length > 1 && cohort.roleKey !== "ADMINISTRATOR")
    .sort((left, right) => right.users.length - left.users.length);

  console.log("\n=== Security Migration Audit ===\n");

  console.log("Roles:");
  console.table(
    roles.map((role) => ({
      roleKey: role.roleKey,
      roleName: role.roleName,
      type: role.isSystemRole ? "System" : "Custom",
      legacyUserRoles: role._count.userRoles,
      directAssignments: role._count.userRoleAssignments,
      groupAssignments: role._count.accessGroupRoleAssignments,
    }))
  );

  console.log("Users with assigned access:");
  console.table(
    users.map((user) => ({
      user: displayName(user),
      legacyRoles: user.userRoles.map((entry) => entry.role.roleKey).join(", "),
      directAssignments: user.roleAssignments
        .map(
          (entry) =>
            `${entry.role.roleKey}:${entry.scopeType}${entry.scopeId ? `:${entry.scopeId}` : ""}`
        )
        .join(", "),
    }))
  );

  console.log("Direct assignment cohorts worth considering for group migration:");
  console.table(
    candidateCohorts.map((cohort) => ({
      roleKey: cohort.roleKey,
      roleName: cohort.roleName,
      scopeType: cohort.scopeType,
      scopeId: cohort.scopeId || "(global)",
      userCount: cohort.users.length,
      expiringCount: cohort.expiringCount,
      users: cohort.users.join(", "),
    }))
  );

  console.log("Existing access groups:");
  console.table(
    groups.map((group) => ({
      groupName: group.groupName,
      isActive: group.isActive,
      memberships: group._count.memberships,
      roleAssignments: group._count.roleAssignments,
    }))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });