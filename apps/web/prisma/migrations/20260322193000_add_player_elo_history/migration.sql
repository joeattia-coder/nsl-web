CREATE TABLE "PlayerEloHistory" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "ratingBefore" INTEGER NOT NULL,
    "ratingAfter" INTEGER NOT NULL,
    "ratingChange" INTEGER NOT NULL,
    "matchesPlayed" INTEGER NOT NULL,
    "expectedScore" DOUBLE PRECISION NOT NULL,
    "actualScore" DOUBLE PRECISION NOT NULL,
    "opponentAverage" DOUBLE PRECISION NOT NULL,
    "matchDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerEloHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlayerEloHistory_playerId_matchId_key" ON "PlayerEloHistory"("playerId", "matchId");
CREATE INDEX "PlayerEloHistory_playerId_matchDate_idx" ON "PlayerEloHistory"("playerId", "matchDate");
CREATE INDEX "PlayerEloHistory_matchId_idx" ON "PlayerEloHistory"("matchId");

ALTER TABLE "PlayerEloHistory"
ADD CONSTRAINT "PlayerEloHistory_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlayerEloHistory"
ADD CONSTRAINT "PlayerEloHistory_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;