import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { parseDateTimeInTimeZone, parseStoredMatchDateTime } from "../src/lib/timezone";

const DEFAULT_CUTOFF = "2026-03-25T00:00:00.000Z";

function parseApplyFlag() {
  return process.argv.slice(2).includes("--apply");
}

function parseCutoffArg() {
  const rawArg = process.argv.slice(2).find((arg) => arg.startsWith("--before="));
  const rawValue = rawArg ? rawArg.slice("--before=".length) : DEFAULT_CUTOFF;
  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid --before value: ${rawValue}`);
  }

  return parsed;
}

function correctNaiveDateTime(value: Date | null) {
  if (!value) {
    return null;
  }

  return parseDateTimeInTimeZone(value.toISOString().slice(0, 19));
}

type TournamentRepair = {
  id: string;
  tournamentName: string;
  updatedAt: Date;
  changes: Record<string, { from: string; to: string }>;
};

type MatchRepair = {
  id: string;
  tournamentName: string;
  updatedAt: Date;
  changes: Record<string, { from: string; to: string }>;
};

async function loadTournamentRepairs(cutoff: Date) {
  const tournaments = await prisma.tournament.findMany({
    where: {
      updatedAt: { lt: cutoff },
      OR: [
        { registrationDeadline: { not: null } },
        { startDate: { not: null } },
        { endDate: { not: null } },
      ],
    },
    select: {
      id: true,
      tournamentName: true,
      updatedAt: true,
      registrationDeadline: true,
      startDate: true,
      endDate: true,
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
  });

  return tournaments
    .map<TournamentRepair | null>((tournament) => {
      const changes: TournamentRepair["changes"] = {};

      const correctedRegistrationDeadline = correctNaiveDateTime(tournament.registrationDeadline);
      if (
        tournament.registrationDeadline &&
        correctedRegistrationDeadline &&
        correctedRegistrationDeadline.toISOString() !== tournament.registrationDeadline.toISOString()
      ) {
        changes.registrationDeadline = {
          from: tournament.registrationDeadline.toISOString(),
          to: correctedRegistrationDeadline.toISOString(),
        };
      }

      const correctedStartDate = correctNaiveDateTime(tournament.startDate);
      if (tournament.startDate && correctedStartDate && correctedStartDate.toISOString() !== tournament.startDate.toISOString()) {
        changes.startDate = {
          from: tournament.startDate.toISOString(),
          to: correctedStartDate.toISOString(),
        };
      }

      const correctedEndDate = correctNaiveDateTime(tournament.endDate);
      if (tournament.endDate && correctedEndDate && correctedEndDate.toISOString() !== tournament.endDate.toISOString()) {
        changes.endDate = {
          from: tournament.endDate.toISOString(),
          to: correctedEndDate.toISOString(),
        };
      }

      if (Object.keys(changes).length === 0) {
        return null;
      }

      return {
        id: tournament.id,
        tournamentName: tournament.tournamentName,
        updatedAt: tournament.updatedAt,
        changes,
      };
    })
    .filter((repair): repair is TournamentRepair => repair !== null);
}

async function loadMatchRepairs(cutoff: Date) {
  const matches = await prisma.match.findMany({
    where: {
      updatedAt: { lt: cutoff },
      OR: [
        { matchDate: { not: null } },
        { resultSubmittedAt: { not: null } },
        { approvedAt: { not: null } },
      ],
    },
    select: {
      id: true,
      updatedAt: true,
      matchDate: true,
      matchTime: true,
      resultSubmittedAt: true,
      approvedAt: true,
      tournament: {
        select: {
          tournamentName: true,
        },
      },
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
  });

  return matches
    .map<MatchRepair | null>((match) => {
      const changes: MatchRepair["changes"] = {};

      const correctedMatchDate = parseStoredMatchDateTime(match.matchDate, match.matchTime);
      if (match.matchDate && correctedMatchDate && correctedMatchDate.toISOString() !== match.matchDate.toISOString()) {
        changes.matchDate = {
          from: match.matchDate.toISOString(),
          to: correctedMatchDate.toISOString(),
        };
      }

      const correctedResultSubmittedAt = correctNaiveDateTime(match.resultSubmittedAt);
      if (
        match.resultSubmittedAt &&
        correctedResultSubmittedAt &&
        correctedResultSubmittedAt.toISOString() !== match.resultSubmittedAt.toISOString()
      ) {
        changes.resultSubmittedAt = {
          from: match.resultSubmittedAt.toISOString(),
          to: correctedResultSubmittedAt.toISOString(),
        };
      }

      const correctedApprovedAt = correctNaiveDateTime(match.approvedAt);
      if (match.approvedAt && correctedApprovedAt && correctedApprovedAt.toISOString() !== match.approvedAt.toISOString()) {
        changes.approvedAt = {
          from: match.approvedAt.toISOString(),
          to: correctedApprovedAt.toISOString(),
        };
      }

      if (Object.keys(changes).length === 0) {
        return null;
      }

      return {
        id: match.id,
        tournamentName: match.tournament.tournamentName,
        updatedAt: match.updatedAt,
        changes,
      };
    })
    .filter((repair): repair is MatchRepair => repair !== null);
}

async function applyTournamentRepairs(repairs: TournamentRepair[]) {
  for (const repair of repairs) {
    await prisma.tournament.update({
      where: { id: repair.id },
      data: {
        registrationDeadline: repair.changes.registrationDeadline?.to
          ? new Date(repair.changes.registrationDeadline.to)
          : undefined,
        startDate: repair.changes.startDate?.to ? new Date(repair.changes.startDate.to) : undefined,
        endDate: repair.changes.endDate?.to ? new Date(repair.changes.endDate.to) : undefined,
      },
    });
  }
}

async function applyMatchRepairs(repairs: MatchRepair[]) {
  for (const repair of repairs) {
    await prisma.match.update({
      where: { id: repair.id },
      data: {
        matchDate: repair.changes.matchDate?.to ? new Date(repair.changes.matchDate.to) : undefined,
        resultSubmittedAt: repair.changes.resultSubmittedAt?.to
          ? new Date(repair.changes.resultSubmittedAt.to)
          : undefined,
        approvedAt: repair.changes.approvedAt?.to ? new Date(repair.changes.approvedAt.to) : undefined,
      },
    });
  }
}

function summarizeChanges(repairs: Array<TournamentRepair | MatchRepair>) {
  return repairs.map((repair) => ({
    id: repair.id,
    name: repair.tournamentName,
    updatedAt: repair.updatedAt.toISOString(),
    fields: Object.keys(repair.changes).join(", "),
  }));
}

async function main() {
  const apply = parseApplyFlag();
  const cutoff = parseCutoffArg();

  const [tournamentRepairs, matchRepairs] = await Promise.all([
    loadTournamentRepairs(cutoff),
    loadMatchRepairs(cutoff),
  ]);

  console.log("\n=== Timezone Datetime Backfill ===\n");
  console.log(apply ? "Mode: APPLY" : "Mode: DRY RUN");
  console.log(`Cutoff: ${cutoff.toISOString()}`);
  console.log("Only records updated before the cutoff are considered.\n");

  console.log(`Tournament repairs: ${tournamentRepairs.length}`);
  if (tournamentRepairs.length > 0) {
    console.table(summarizeChanges(tournamentRepairs).slice(0, 20));
  }

  console.log(`Match repairs: ${matchRepairs.length}`);
  if (matchRepairs.length > 0) {
    console.table(summarizeChanges(matchRepairs).slice(0, 20));
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to persist the updates.");
    return;
  }

  await applyTournamentRepairs(tournamentRepairs);
  await applyMatchRepairs(matchRepairs);

  console.log("\nApplied timezone datetime repairs successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });