import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { deriveMatchResultFromLiveSession } from "@/lib/live-session-match-result";
import { persistOfficialMatchResult } from "@/lib/match-finalization";
import {
  getMatchResultSubmissionFrames,
  getPendingMatchResultSubmissionForTargetEntry,
} from "@/lib/match-result-submission-store";
import { getPlayerMatchAccessContext } from "@/lib/player-match-access";
import { recalculateAndPersistPlayerElo } from "@/lib/player-elo";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await resolveCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!currentUser.linkedPlayerId) {
      return NextResponse.json({ error: "Your account is not linked to a player profile." }, { status: 403 });
    }

    const { id } = await context.params;
    const accessContext = await getPlayerMatchAccessContext(id, currentUser.linkedPlayerId);

    if (!accessContext) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const pendingSubmission = await getPendingMatchResultSubmissionForTargetEntry(id, accessContext.currentEntry.id);

    if (!pendingSubmission) {
      return NextResponse.json({ error: "No pending result submission found for this match." }, { status: 404 });
    }

    const frames = await getMatchResultSubmissionFrames(pendingSubmission.id);
    const bestOfFrames = accessContext.match.bestOfFrames ?? frames.length;
    const liveSession = await prisma.matchLiveSession.findUnique({
      where: {
        matchId: id,
      },
      select: {
        scoringState: true,
        lastSyncedAt: true,
      },
    });
    const derivedLiveResult = liveSession
      ? deriveMatchResultFromLiveSession({
          scoringState: liveSession.scoringState,
          homeEntryId: accessContext.homeEntry.id,
          awayEntryId: accessContext.awayEntry.id,
          completedAt: liveSession.lastSyncedAt.toISOString(),
        })
      : null;
    const useLiveFrames = Boolean(
      derivedLiveResult &&
      derivedLiveResult.homeScore === pendingSubmission.homeScore &&
      derivedLiveResult.awayScore === pendingSubmission.awayScore &&
      derivedLiveResult.winnerEntryId === pendingSubmission.winnerEntryId
    );

    await prisma.$transaction(async (tx) => {
      await persistOfficialMatchResult({
        tx,
        matchId: id,
        currentUserId: currentUser.id,
        enteredByUserId: pendingSubmission.submittedByUserId,
        matchDate: pendingSubmission.proposedMatchDate,
        matchTime: pendingSubmission.proposedMatchTime,
        homeScore: pendingSubmission.homeScore,
        awayScore: pendingSubmission.awayScore,
        winnerEntryId: pendingSubmission.winnerEntryId,
        resultSubmittedAt: pendingSubmission.proposedEndedAt,
        frames: Array.from({ length: bestOfFrames }, (_, index) => {
          const frame = useLiveFrames
            ? (derivedLiveResult?.frames[index] ?? {
                frameNumber: index + 1,
                winnerEntryId: null,
                homePoints: 0,
                awayPoints: 0,
                homeHighBreak: null,
                awayHighBreak: null,
              })
            : (frames[index] ?? {
                frameNumber: index + 1,
                homeHighBreak: null,
                awayHighBreak: null,
              });

          return {
            frameNumber: index + 1,
            winnerEntryId: "winnerEntryId" in frame && typeof frame.winnerEntryId === "string" ? frame.winnerEntryId : null,
            homePoints: "homePoints" in frame && typeof frame.homePoints === "number" ? frame.homePoints : null,
            awayPoints: "awayPoints" in frame && typeof frame.awayPoints === "number" ? frame.awayPoints : null,
            homeHighBreak: frame.homeHighBreak,
            awayHighBreak: frame.awayHighBreak,
          };
        }),
      });

      await tx.$executeRaw(Prisma.sql`
        UPDATE "MatchResultSubmission"
        SET
          "status" = 'APPROVED'::"MatchResultSubmissionStatus",
          "approvedAt" = CURRENT_TIMESTAMP,
          "approvedByUserId" = ${currentUser.id},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${pendingSubmission.id}
          AND "status" = 'PENDING'::"MatchResultSubmissionStatus"
      `);
    });

    await recalculateAndPersistPlayerElo(prisma);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/my-matches/[id]/submission/approve error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve the submitted match result.",
      },
      { status: 500 }
    );
  }
}