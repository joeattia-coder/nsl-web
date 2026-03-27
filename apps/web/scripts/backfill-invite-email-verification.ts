import "dotenv/config";

import { prisma } from "../src/lib/prisma";

function parseApplyFlag() {
  return process.argv.slice(2).includes("--apply");
}

function getVerificationTimestamp(
  invitations: Array<{
    acceptedAt: Date | null;
    createdAt: Date;
  }>
) {
  return invitations
    .map((invitation) => invitation.acceptedAt ?? invitation.createdAt)
    .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;
}

async function loadCandidates() {
  const users = await prisma.user.findMany({
    where: {
      emailVerifiedAt: null,
      targetInvitations: {
        some: {
          status: "ACCEPTED",
        },
      },
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      player: {
        select: {
          firstName: true,
          middleInitial: true,
          lastName: true,
        },
      },
      targetInvitations: {
        where: {
          status: "ACCEPTED",
        },
        orderBy: [{ acceptedAt: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          acceptedAt: true,
          createdAt: true,
          email: true,
        },
      },
    },
  });

  return users
    .map((user) => ({
      ...user,
      verificationTimestamp: getVerificationTimestamp(user.targetInvitations),
    }))
    .filter(
      (user): user is typeof user & { verificationTimestamp: Date } =>
        Boolean(user.verificationTimestamp)
    );
}

function displayName(user: {
  email: string | null;
  username: string | null;
  player: {
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  } | null;
}) {
  if (user.player) {
    return [user.player.firstName, user.player.middleInitial, user.player.lastName]
      .filter(Boolean)
      .join(" ");
  }

  return user.username ?? user.email ?? "(unnamed)";
}

async function applyBackfill(
  candidates: Array<{
    id: string;
    verificationTimestamp: Date;
  }>
) {
  let updated = 0;

  for (const candidate of candidates) {
    await prisma.user.update({
      where: { id: candidate.id },
      data: {
        emailVerifiedAt: candidate.verificationTimestamp,
      },
    });

    updated += 1;
  }

  return updated;
}

async function main() {
  const apply = parseApplyFlag();
  const candidates = await loadCandidates();

  console.log("\n=== Invitation Email Verification Backfill ===\n");
  console.log(apply ? "Mode: APPLY" : "Mode: DRY RUN");
  console.log(
    "Accepted invitation accounts with a missing emailVerifiedAt will be marked verified using the invitation acceptance timestamp.\n"
  );

  if (candidates.length === 0) {
    console.log("No accepted-invitation users are missing email verification. Nothing to backfill.");
    return;
  }

  console.table(
    candidates.map((candidate) => ({
      user: displayName(candidate),
      email: candidate.email ?? "",
      invitationCount: candidate.targetInvitations.length,
      verifiedAt: candidate.verificationTimestamp.toISOString(),
      createdAt: candidate.createdAt.toISOString(),
    }))
  );

  if (!apply) {
    console.log(`\nDry run complete. ${candidates.length} user(s) would be updated.`);
    console.log("Run with --apply to persist the backfill.");
    return;
  }

  const updated = await applyBackfill(candidates);
  console.log(`\nBackfill complete. Updated ${updated} user(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});