import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { resolveCurrentUser } from "@/lib/admin-auth";
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

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: {
          id,
        },
        data: {
          matchDate: pendingSubmission.proposedMatchDate,
          matchTime: pendingSubmission.proposedMatchTime,
          matchStatus: "COMPLETED",
          homeScore: pendingSubmission.homeScore,
          awayScore: pendingSubmission.awayScore,
          winnerEntryId: pendingSubmission.winnerEntryId,
          resultSubmittedAt: pendingSubmission.proposedEndedAt,
          approvedAt: new Date(),
          approvedByUserId: currentUser.id,
          enteredByUserId: pendingSubmission.submittedByUserId,
          updatedByUserId: currentUser.id,
        },
      });

      for (let index = 0; index < bestOfFrames; index += 1) {
        const frame = frames[index] ?? {
          frameNumber: index + 1,
          homeHighBreak: null,
          awayHighBreak: null,
        };

        await tx.matchFrame.upsert({
          where: {
            matchId_frameNumber: {
              matchId: id,
              frameNumber: index + 1,
            },
          },
          create: {
            matchId: id,
            frameNumber: index + 1,
            homeHighBreak: frame.homeHighBreak,
            awayHighBreak: frame.awayHighBreak,
          },
          update: {
            homeHighBreak: frame.homeHighBreak,
            awayHighBreak: frame.awayHighBreak,
          },
        });
      }

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