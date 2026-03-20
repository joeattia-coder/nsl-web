-- AlterTable
ALTER TABLE "StageRound" ADD COLUMN "snookerFormat" "SnookerFormat";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "snookerFormat" "SnookerFormat";

-- Backfill stage round snooker format from tournament setting, fallback to full rack
UPDATE "StageRound" AS sr
SET "snookerFormat" = COALESCE(t."snookerFormat", 'REDS_15'::"SnookerFormat")
FROM "TournamentStage" AS ts
JOIN "Tournament" AS t ON t."id" = ts."tournamentId"
WHERE sr."tournamentStageId" = ts."id"
  AND sr."snookerFormat" IS NULL;

-- Backfill match snooker format from stage round setting, fallback to tournament, then full rack
UPDATE "Match" AS m
SET "snookerFormat" = COALESCE(sr."snookerFormat", t."snookerFormat", 'REDS_15'::"SnookerFormat")
FROM "StageRound" AS sr, "Tournament" AS t
WHERE sr."id" = m."stageRoundId"
  AND t."id" = m."tournamentId"
  AND m."snookerFormat" IS NULL;
