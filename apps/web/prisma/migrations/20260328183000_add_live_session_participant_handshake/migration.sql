ALTER TABLE "MatchLiveSession"
ADD COLUMN "homeStartedAt" TIMESTAMP(3),
ADD COLUMN "awayStartedAt" TIMESTAMP(3),
ADD COLUMN "homeCompletedAt" TIMESTAMP(3),
ADD COLUMN "awayCompletedAt" TIMESTAMP(3),
ADD COLUMN "finalizedAt" TIMESTAMP(3);

CREATE INDEX "MatchLiveSession_homeStartedAt_idx" ON "MatchLiveSession"("homeStartedAt");

CREATE INDEX "MatchLiveSession_awayStartedAt_idx" ON "MatchLiveSession"("awayStartedAt");

CREATE INDEX "MatchLiveSession_finalizedAt_idx" ON "MatchLiveSession"("finalizedAt");