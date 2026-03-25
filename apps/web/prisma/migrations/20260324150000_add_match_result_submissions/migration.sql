CREATE TYPE "MatchResultSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'DISPUTED');

CREATE TABLE "MatchResultSubmission" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "submittedByUserId" TEXT NOT NULL,
  "submittedByPlayerId" TEXT NOT NULL,
  "submittedByEntryId" TEXT NOT NULL,
  "targetEntryId" TEXT NOT NULL,
  "winnerEntryId" TEXT,
  "homeScore" INTEGER NOT NULL,
  "awayScore" INTEGER NOT NULL,
  "status" "MatchResultSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "summaryNote" TEXT,
  "proposedMatchDate" TIMESTAMP(3),
  "proposedMatchTime" TEXT,
  "proposedEndedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "approvedByUserId" TEXT,
  "disputedAt" TIMESTAMP(3),
  "disputedByUserId" TEXT,
  "disputeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MatchResultSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MatchResultSubmission_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MatchResultSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MatchResultSubmission_submittedByPlayerId_fkey" FOREIGN KEY ("submittedByPlayerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MatchResultSubmission_submittedByEntryId_fkey" FOREIGN KEY ("submittedByEntryId") REFERENCES "TournamentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MatchResultSubmission_targetEntryId_fkey" FOREIGN KEY ("targetEntryId") REFERENCES "TournamentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MatchResultSubmission_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "TournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MatchResultSubmission_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "MatchResultSubmission_disputedByUserId_fkey" FOREIGN KEY ("disputedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "MatchResultSubmissionFrame" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "frameNumber" INTEGER NOT NULL,
  "homeHighBreak" INTEGER,
  "awayHighBreak" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MatchResultSubmissionFrame_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MatchResultSubmissionFrame_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "MatchResultSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "MatchResultSubmission_matchId_idx" ON "MatchResultSubmission"("matchId");
CREATE INDEX "MatchResultSubmission_status_idx" ON "MatchResultSubmission"("status");
CREATE INDEX "MatchResultSubmission_submittedByPlayerId_idx" ON "MatchResultSubmission"("submittedByPlayerId");
CREATE INDEX "MatchResultSubmission_submittedByEntryId_idx" ON "MatchResultSubmission"("submittedByEntryId");
CREATE INDEX "MatchResultSubmission_targetEntryId_idx" ON "MatchResultSubmission"("targetEntryId");
CREATE INDEX "MatchResultSubmission_submittedAt_idx" ON "MatchResultSubmission"("submittedAt");
CREATE INDEX "MatchResultSubmission_approvedByUserId_idx" ON "MatchResultSubmission"("approvedByUserId");
CREATE INDEX "MatchResultSubmission_disputedByUserId_idx" ON "MatchResultSubmission"("disputedByUserId");

CREATE UNIQUE INDEX "MatchResultSubmissionFrame_submissionId_frameNumber_key"
ON "MatchResultSubmissionFrame"("submissionId", "frameNumber");

CREATE INDEX "MatchResultSubmissionFrame_submissionId_idx"
ON "MatchResultSubmissionFrame"("submissionId");
