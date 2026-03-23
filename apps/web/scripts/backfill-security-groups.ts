import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const GLOBAL_ADMIN_ROLE_KEY = "ADMINISTRATOR";
const BACKFILL_GROUP_PREFIX = "Migrated Access";

type UserNameLike = {
  username: string | null;
  email: string | null;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
};

type DirectAssignmentRecord = {
  userId: string;
  roleId: string;
  scopeType: string;
  scopeId: string;
  expiresAt: Date | null;
  role: {
    roleKey: string;
    roleName: string;
  };
  user: UserNameLike;
};

type CandidateCohort = {
  roleId: string;
  roleKey: string;
  roleName: string;
  scopeType: string;
  scopeId: string;
  expiresAt: Date | null;
  userIds: string[];
  users: string[];
};

function displayName(user: UserNameLike) {
  if (user.player) {
    return [user.player.firstName, user.player.middleInitial, user.player.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return user.username ?? user.email ?? "(unnamed)";
}

function formatScope(scopeType: string, scopeId: string) {
  return scopeId ? `${scopeType}:${scopeId}` : scopeType;
}

function formatExpiry(expiresAt: Date | null) {
  return expiresAt ? expiresAt.toISOString() : "never";
}

function buildCohortKey(assignment: DirectAssignmentRecord) {
  return [
    assignment.roleId,
    assignment.scopeType,
    assignment.scopeId,
    assignment.expiresAt?.toISOString() ?? "never",
  ].join("|");
}

function buildGroupName(cohort: CandidateCohort) {
  const expiryLabel = cohort.expiresAt
    ? ` until ${cohort.expiresAt.toISOString().slice(0, 10)}`
    : "";

  return `${BACKFILL_GROUP_PREFIX}: ${cohort.roleName} (${formatScope(
    cohort.scopeType,
    cohort.scopeId
  )}${expiryLabel})`;
}

function buildGroupDescription(cohort: CandidateCohort) {
  return [
    "Created by the security backfill script.",
    `Role: ${cohort.roleKey}`,
    `Scope: ${formatScope(cohort.scopeType, cohort.scopeId)}`,
    `Expires: ${formatExpiry(cohort.expiresAt)}`,
    "Legacy direct assignments are intentionally retained for verification.",
  ].join(" ");
}

function parseApplyFlag() {
  return process.argv.slice(2).includes("--apply");
}

async function loadCandidateCohorts() {
  const now = new Date();
  const directAssignments = await prisma.userRoleAssignment.findMany({
    where: {
      role: {
        roleKey: {
          not: GLOBAL_ADMIN_ROLE_KEY,
        },
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [
      { role: { roleName: "asc" } },
      { scopeType: "asc" },
      { scopeId: "asc" },
      { expiresAt: "asc" },
      { user: { createdAt: "asc" } },
    ],
    select: {
      userId: true,
      roleId: true,
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
  });

  const grouped = new Map<string, CandidateCohort>();

  for (const assignment of directAssignments) {
    const key = buildCohortKey(assignment);
    const existing = grouped.get(key);

    if (existing) {
      existing.userIds.push(assignment.userId);
      existing.users.push(displayName(assignment.user));
      continue;
    }

    grouped.set(key, {
      roleId: assignment.roleId,
      roleKey: assignment.role.roleKey,
      roleName: assignment.role.roleName,
      scopeType: assignment.scopeType,
      scopeId: assignment.scopeId,
      expiresAt: assignment.expiresAt,
      userIds: [assignment.userId],
      users: [displayName(assignment.user)],
    });
  }

  return Array.from(grouped.values())
    .map((cohort) => ({
      ...cohort,
      userIds: Array.from(new Set(cohort.userIds)),
      users: Array.from(new Set(cohort.users)).sort((left, right) => left.localeCompare(right)),
    }))
    .filter((cohort) => cohort.userIds.length > 1)
    .sort((left, right) => {
      if (right.userIds.length !== left.userIds.length) {
        return right.userIds.length - left.userIds.length;
      }

      return left.roleName.localeCompare(right.roleName);
    });
}

async function applyBackfill(cohort: CandidateCohort) {
  const groupName = buildGroupName(cohort);
  const description = buildGroupDescription(cohort);

  return prisma.$transaction(async (tx) => {
    const existingGroup = await tx.accessGroup.findUnique({
      where: { groupName },
      select: { id: true },
    });

    const group = existingGroup
      ? await tx.accessGroup.update({
          where: { id: existingGroup.id },
          data: {
            description,
            isActive: true,
          },
          select: { id: true, groupName: true },
        })
      : await tx.accessGroup.create({
          data: {
            groupName,
            description,
            isActive: true,
          },
          select: { id: true, groupName: true },
        });

    const membershipResult = await tx.accessGroupMembership.createMany({
      data: cohort.userIds.map((userId) => ({
        groupId: group.id,
        userId,
      })),
      skipDuplicates: true,
    });

    const assignmentResult = await tx.accessGroupRoleAssignment.createMany({
      data: [
        {
          groupId: group.id,
          roleId: cohort.roleId,
          scopeType: cohort.scopeType as never,
          scopeId: cohort.scopeId,
          expiresAt: cohort.expiresAt,
          grantedByUserId: null,
        },
      ],
      skipDuplicates: true,
    });

    return {
      groupName: group.groupName,
      createdGroup: existingGroup ? 0 : 1,
      membershipsCreated: membershipResult.count,
      grantsCreated: assignmentResult.count,
    };
  });
}

async function main() {
  const apply = parseApplyFlag();
  const candidateCohorts = await loadCandidateCohorts();

  console.log("\n=== Security Group Backfill ===\n");
  console.log(apply ? "Mode: APPLY" : "Mode: DRY RUN");
  console.log("Only repeated non-administrator direct assignments are considered.");
  console.log("Legacy direct assignments are preserved; this script only adds groups.\n");

  if (candidateCohorts.length === 0) {
    console.log("No repeated direct-assignment cohorts were found. Nothing to backfill.");
    return;
  }

  console.table(
    candidateCohorts.map((cohort) => ({
      groupName: buildGroupName(cohort),
      roleKey: cohort.roleKey,
      scope: formatScope(cohort.scopeType, cohort.scopeId),
      expiresAt: formatExpiry(cohort.expiresAt),
      userCount: cohort.userIds.length,
      users: cohort.users.join(", "),
    }))
  );

  if (!apply) {
    console.log("Dry run complete. Re-run with --apply to create groups, memberships, and grants.");
    return;
  }

  const results: Array<{
    groupName: string;
    createdGroup: number;
    membershipsCreated: number;
    grantsCreated: number;
  }> = [];

  for (const cohort of candidateCohorts) {
    results.push(await applyBackfill(cohort));
  }

  console.log("\nApplied changes:");
  console.table(results);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });