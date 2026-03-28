import type { Prisma } from "@/generated/prisma/client";

export type FinalizedMatchFrameInput = {
  frameNumber: number;
  winnerEntryId: string | null;
  homePoints: number | null;
  awayPoints: number | null;
  homeHighBreak: number | null;
  awayHighBreak: number | null;
};

type PersistOfficialMatchResultInput = {
  tx: Prisma.TransactionClient;
  matchId: string;
  currentUserId: string;
  enteredByUserId: string;
  matchDate: Date | null;
  matchTime: string | null;
  homeScore: number;
  awayScore: number;
  winnerEntryId: string | null;
  resultSubmittedAt: Date | null;
  frames: FinalizedMatchFrameInput[];
  liveSession?: {
    sessionId?: string | null;
    finalize: boolean;
  };
};

export async function persistOfficialMatchResult({
  tx,
  matchId,
  currentUserId,
  enteredByUserId,
  matchDate,
  matchTime,
  homeScore,
  awayScore,
  winnerEntryId,
  resultSubmittedAt,
  frames,
  liveSession,
}: PersistOfficialMatchResultInput) {
  await tx.match.update({
    where: {
      id: matchId,
    },
    data: {
      matchDate,
      matchTime,
      matchStatus: "COMPLETED",
      homeScore,
      awayScore,
      winnerEntryId,
      resultSubmittedAt,
      approvedAt: new Date(),
      approvedByUserId: currentUserId,
      enteredByUserId,
      updatedByUserId: currentUserId,
    },
  });

  for (const frame of frames) {
    await tx.matchFrame.upsert({
      where: {
        matchId_frameNumber: {
          matchId,
          frameNumber: frame.frameNumber,
        },
      },
      create: {
        matchId,
        frameNumber: frame.frameNumber,
        winnerEntryId: frame.winnerEntryId,
        homePoints: frame.homePoints,
        awayPoints: frame.awayPoints,
        homeHighBreak: frame.homeHighBreak,
        awayHighBreak: frame.awayHighBreak,
      },
      update: {
        winnerEntryId: frame.winnerEntryId,
        homePoints: frame.homePoints,
        awayPoints: frame.awayPoints,
        homeHighBreak: frame.homeHighBreak,
        awayHighBreak: frame.awayHighBreak,
      },
    });
  }

  if (liveSession?.finalize) {
    await tx.matchLiveSession.updateMany({
      where: {
        matchId,
        ...(liveSession.sessionId ? { id: liveSession.sessionId } : {}),
      },
      data: {
        status: "COMPLETED",
        finalizedAt: new Date(),
        updatedByUserId: currentUserId,
      },
    });
  }
}