-- AlterTable
ALTER TABLE "StageRound" ADD COLUMN "bestOfFrames" INTEGER;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "bestOfFrames" INTEGER;

-- AlterTable
ALTER TABLE "MatchFrame" ADD COLUMN "homeHighBreak" INTEGER;
ALTER TABLE "MatchFrame" ADD COLUMN "awayHighBreak" INTEGER;

-- Backfill existing rounds and matches to best-of-5 as requested
UPDATE "StageRound" SET "bestOfFrames" = 5 WHERE "bestOfFrames" IS NULL;
UPDATE "Match" SET "bestOfFrames" = 5 WHERE "bestOfFrames" IS NULL;
