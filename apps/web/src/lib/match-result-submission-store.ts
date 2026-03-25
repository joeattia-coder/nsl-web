import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { MatchResultSubmissionFrameValue } from "@/lib/match-result-submissions";

const MATCH_RESULT_SUBMISSION_TABLES_MISSING_MESSAGE =
  "Match result submission tables are not available in the current database. Apply the checked-in additive migration before using this workflow.";

let submissionTablesAvailablePromise: Promise<boolean> | null = null;

export type MatchResultSubmissionStatus = "PENDING" | "APPROVED" | "DISPUTED";

export type StoredMatchResultSubmission = {
  id: string;
  matchId: string;
  submittedByUserId: string;
  submittedByPlayerId: string;
  submittedByEntryId: string;
  targetEntryId: string;
  winnerEntryId: string | null;
  homeScore: number;
  awayScore: number;
  status: MatchResultSubmissionStatus;
  summaryNote: string | null;
  proposedMatchDate: Date | null;
  proposedMatchTime: string | null;
  proposedEndedAt: Date | null;
  submittedAt: Date;
  approvedAt: Date | null;
  approvedByUserId: string | null;
  disputedAt: Date | null;
  disputedByUserId: string | null;
  disputeReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredMatchResultSubmissionFrame = MatchResultSubmissionFrameValue;

async function hasMatchResultSubmissionTables() {
  submissionTablesAvailablePromise ??= prisma
    .$queryRaw<Array<{ submissionTable: string | null; frameTable: string | null }>>(Prisma.sql`
      SELECT
        to_regclass('public."MatchResultSubmission"')::text AS "submissionTable",
        to_regclass('public."MatchResultSubmissionFrame"')::text AS "frameTable"
    `)
    .then((rows) => Boolean(rows[0]?.submissionTable && rows[0]?.frameTable))
    .catch(() => false);

  return submissionTablesAvailablePromise;
}

async function assertMatchResultSubmissionTables() {
  const tablesAvailable = await hasMatchResultSubmissionTables();

  if (!tablesAvailable) {
    throw new Error(MATCH_RESULT_SUBMISSION_TABLES_MISSING_MESSAGE);
  }
}

function mapSubmissionRow(row: Record<string, unknown>): StoredMatchResultSubmission {
  return {
    id: String(row.id),
    matchId: String(row.matchId),
    submittedByUserId: String(row.submittedByUserId),
    submittedByPlayerId: String(row.submittedByPlayerId),
    submittedByEntryId: String(row.submittedByEntryId),
    targetEntryId: String(row.targetEntryId),
    winnerEntryId: row.winnerEntryId ? String(row.winnerEntryId) : null,
    homeScore: Number(row.homeScore),
    awayScore: Number(row.awayScore),
    status: String(row.status) as MatchResultSubmissionStatus,
    summaryNote: row.summaryNote ? String(row.summaryNote) : null,
    proposedMatchDate: row.proposedMatchDate instanceof Date ? row.proposedMatchDate : row.proposedMatchDate ? new Date(String(row.proposedMatchDate)) : null,
    proposedMatchTime: row.proposedMatchTime ? String(row.proposedMatchTime) : null,
    proposedEndedAt: row.proposedEndedAt instanceof Date ? row.proposedEndedAt : row.proposedEndedAt ? new Date(String(row.proposedEndedAt)) : null,
    submittedAt: row.submittedAt instanceof Date ? row.submittedAt : new Date(String(row.submittedAt)),
    approvedAt: row.approvedAt instanceof Date ? row.approvedAt : row.approvedAt ? new Date(String(row.approvedAt)) : null,
    approvedByUserId: row.approvedByUserId ? String(row.approvedByUserId) : null,
    disputedAt: row.disputedAt instanceof Date ? row.disputedAt : row.disputedAt ? new Date(String(row.disputedAt)) : null,
    disputedByUserId: row.disputedByUserId ? String(row.disputedByUserId) : null,
    disputeReason: row.disputeReason ? String(row.disputeReason) : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt)),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(String(row.updatedAt)),
  };
}

function mapFrameRow(row: Record<string, unknown>): StoredMatchResultSubmissionFrame {
  return {
    frameNumber: Number(row.frameNumber),
    homeHighBreak: row.homeHighBreak === null || row.homeHighBreak === undefined ? null : Number(row.homeHighBreak),
    awayHighBreak: row.awayHighBreak === null || row.awayHighBreak === undefined ? null : Number(row.awayHighBreak),
  };
}

export async function createMatchResultSubmission(input: {
  matchId: string;
  submittedByUserId: string;
  submittedByPlayerId: string;
  submittedByEntryId: string;
  targetEntryId: string;
  winnerEntryId: string | null;
  homeScore: number;
  awayScore: number;
  summaryNote: string | null;
  proposedMatchDate: Date | null;
  proposedMatchTime: string | null;
  proposedEndedAt: Date | null;
  frames: StoredMatchResultSubmissionFrame[];
}) {
  await assertMatchResultSubmissionTables();

  return prisma.$transaction(async (tx) => {
    const insertedRows = await tx.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO "MatchResultSubmission" (
        "id",
        "matchId",
        "submittedByUserId",
        "submittedByPlayerId",
        "submittedByEntryId",
        "targetEntryId",
        "winnerEntryId",
        "homeScore",
        "awayScore",
        "status",
        "summaryNote",
        "proposedMatchDate",
        "proposedMatchTime",
        "proposedEndedAt",
        "submittedAt",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${input.matchId},
        ${input.submittedByUserId},
        ${input.submittedByPlayerId},
        ${input.submittedByEntryId},
        ${input.targetEntryId},
        ${input.winnerEntryId},
        ${input.homeScore},
        ${input.awayScore},
        'PENDING'::"MatchResultSubmissionStatus",
        ${input.summaryNote},
        ${input.proposedMatchDate},
        ${input.proposedMatchTime},
        ${input.proposedEndedAt},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `);

    const inserted = insertedRows[0];

    if (!inserted) {
      throw new Error("Failed to create match result submission.");
    }

    for (const frame of input.frames) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "MatchResultSubmissionFrame" (
          "id",
          "submissionId",
          "frameNumber",
          "homeHighBreak",
          "awayHighBreak",
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${String(inserted.id)},
          ${frame.frameNumber},
          ${frame.homeHighBreak},
          ${frame.awayHighBreak},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `);
    }

    return mapSubmissionRow(inserted);
  });
}

export async function deleteMatchResultSubmission(submissionId: string) {
  await assertMatchResultSubmissionTables();

  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "MatchResultSubmission"
    WHERE "id" = ${submissionId}
  `);
}

export async function getPendingMatchResultSubmissionForMatch(matchId: string) {
  if (!(await hasMatchResultSubmissionTables())) {
    return null;
  }

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT *
    FROM "MatchResultSubmission"
    WHERE "matchId" = ${matchId}
      AND "status" = 'PENDING'::"MatchResultSubmissionStatus"
    ORDER BY "submittedAt" DESC
    LIMIT 1
  `);

  return rows[0] ? mapSubmissionRow(rows[0]) : null;
}

export async function getPendingMatchResultSubmissionForTargetEntry(matchId: string, targetEntryId: string) {
  if (!(await hasMatchResultSubmissionTables())) {
    return null;
  }

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT *
    FROM "MatchResultSubmission"
    WHERE "matchId" = ${matchId}
      AND "targetEntryId" = ${targetEntryId}
      AND "status" = 'PENDING'::"MatchResultSubmissionStatus"
    ORDER BY "submittedAt" DESC
    LIMIT 1
  `);

  return rows[0] ? mapSubmissionRow(rows[0]) : null;
}

export async function getMatchResultSubmissionFrames(submissionId: string) {
  if (!(await hasMatchResultSubmissionTables())) {
    return [];
  }

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT "frameNumber", "homeHighBreak", "awayHighBreak"
    FROM "MatchResultSubmissionFrame"
    WHERE "submissionId" = ${submissionId}
    ORDER BY "frameNumber" ASC
  `);

  return rows.map(mapFrameRow);
}

export async function approveMatchResultSubmission(submissionId: string, approvedByUserId: string) {
  await assertMatchResultSubmissionTables();

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    UPDATE "MatchResultSubmission"
    SET
      "status" = 'APPROVED'::"MatchResultSubmissionStatus",
      "approvedAt" = CURRENT_TIMESTAMP,
      "approvedByUserId" = ${approvedByUserId},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${submissionId}
      AND "status" = 'PENDING'::"MatchResultSubmissionStatus"
    RETURNING *
  `);

  return rows[0] ? mapSubmissionRow(rows[0]) : null;
}

export async function disputeMatchResultSubmission(submissionId: string, disputedByUserId: string, disputeReason: string | null) {
  await assertMatchResultSubmissionTables();

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    UPDATE "MatchResultSubmission"
    SET
      "status" = 'DISPUTED'::"MatchResultSubmissionStatus",
      "disputedAt" = CURRENT_TIMESTAMP,
      "disputedByUserId" = ${disputedByUserId},
      "disputeReason" = ${disputeReason},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${submissionId}
      AND "status" = 'PENDING'::"MatchResultSubmissionStatus"
    RETURNING *
  `);

  return rows[0] ? mapSubmissionRow(rows[0]) : null;
}

export async function getPendingMatchResultSubmissionsForMatches(matchIds: string[], playerEntryIds: string[]) {
  if (matchIds.length === 0 || playerEntryIds.length === 0) {
    return new Map<string, StoredMatchResultSubmission>();
  }

  if (!(await hasMatchResultSubmissionTables())) {
    return new Map<string, StoredMatchResultSubmission>();
  }

  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT DISTINCT ON ("matchId") *
    FROM "MatchResultSubmission"
    WHERE "matchId" IN (${Prisma.join(matchIds)})
      AND (
        "submittedByEntryId" IN (${Prisma.join(playerEntryIds)})
        OR "targetEntryId" IN (${Prisma.join(playerEntryIds)})
      )
      AND "status" = 'PENDING'::"MatchResultSubmissionStatus"
    ORDER BY "matchId", "submittedAt" DESC
  `);

  return new Map(rows.map((row) => {
    const submission = mapSubmissionRow(row);
    return [submission.matchId, submission] as const;
  }));
}
