DO $$
BEGIN
  CREATE TYPE "MatchLiveSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "MatchLiveEventType" AS ENUM ('SESSION_CREATED', 'SNAPSHOT_SYNC', 'STATUS_CHANGED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "MatchLiveSession" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "status" "MatchLiveSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "version" INTEGER NOT NULL DEFAULT 1,
  "scoringState" JSONB,
  "homeFramesWon" INTEGER,
  "awayFramesWon" INTEGER,
  "currentFrameNumber" INTEGER,
  "currentFrameHomePoints" INTEGER,
  "currentFrameAwayPoints" INTEGER,
  "activeSide" TEXT,
  "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByUserId" TEXT,
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchLiveSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MatchLiveEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "eventType" "MatchLiveEventType" NOT NULL,
  "payload" JSONB,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchLiveEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MatchLiveSession_matchId_key" ON "MatchLiveSession"("matchId");
CREATE INDEX IF NOT EXISTS "MatchLiveSession_status_idx" ON "MatchLiveSession"("status");
CREATE INDEX IF NOT EXISTS "MatchLiveSession_lastSyncedAt_idx" ON "MatchLiveSession"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "MatchLiveEvent_sessionId_idx" ON "MatchLiveEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "MatchLiveEvent_version_idx" ON "MatchLiveEvent"("version");
CREATE INDEX IF NOT EXISTS "MatchLiveEvent_createdAt_idx" ON "MatchLiveEvent"("createdAt");

DO $$
BEGIN
  ALTER TABLE "MatchLiveSession"
    ADD CONSTRAINT "MatchLiveSession_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "MatchLiveSession"
    ADD CONSTRAINT "MatchLiveSession_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "MatchLiveSession"
    ADD CONSTRAINT "MatchLiveSession_updatedByUserId_fkey"
    FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "MatchLiveEvent"
    ADD CONSTRAINT "MatchLiveEvent_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "MatchLiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "MatchLiveEvent"
    ADD CONSTRAINT "MatchLiveEvent_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;