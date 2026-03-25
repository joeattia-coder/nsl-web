import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { resolveCurrentUser } from "@/lib/admin-auth";
import {
  formatScheduledAtLabel,
  getRequestOrigin,
} from "@/lib/match-result-submissions";
import {
  getMatchResultSubmissionFrames,
  getPendingMatchResultSubmissionForTargetEntry,
} from "@/lib/match-result-submission-store";
import { sendMatchResultDisputeNotificationEmail } from "@/lib/email";
import {
  getEntryEmailRecipients,
  getPlayerMatchAccessContext,
} from "@/lib/player-match-access";
import { prisma } from "@/lib/prisma";

const CONTACT_EMAIL = "info@nsl-tv.com";

type DisputeRequestBody = {
  disputeReason?: string | null;
};

export async function POST(
  request: Request,
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

    const body = (await request.json().catch(() => null)) as DisputeRequestBody | null;
    const disputeReason = String(body?.disputeReason ?? "").trim();

    if (!disputeReason) {
      return NextResponse.json({ error: "Dispute reason is required." }, { status: 400 });
    }

    if (disputeReason.length > 2000) {
      return NextResponse.json({ error: "Dispute reason must be 2000 characters or fewer." }, { status: 400 });
    }

    const pendingSubmission = await getPendingMatchResultSubmissionForTargetEntry(id, accessContext.currentEntry.id);

    if (!pendingSubmission) {
      return NextResponse.json({ error: "No pending result submission found for this match." }, { status: 404 });
    }

    const frames = await getMatchResultSubmissionFrames(pendingSubmission.id);

    await prisma.$executeRaw(Prisma.sql`
      UPDATE "MatchResultSubmission"
      SET
        "status" = 'DISPUTED'::"MatchResultSubmissionStatus",
        "disputedAt" = CURRENT_TIMESTAMP,
        "disputedByUserId" = ${currentUser.id},
        "disputeReason" = ${disputeReason},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${pendingSubmission.id}
        AND "status" = 'PENDING'::"MatchResultSubmissionStatus"
    `);

    const origin = getRequestOrigin(request);
    const submittedByEntry =
      pendingSubmission.submittedByEntryId === accessContext.homeEntry.id
        ? accessContext.homeEntry
        : accessContext.awayEntry;
    const disputedByEntry =
      pendingSubmission.targetEntryId === accessContext.homeEntry.id
        ? accessContext.homeEntry
        : accessContext.awayEntry;
    const winnerLabel =
      pendingSubmission.winnerEntryId === accessContext.homeEntry.id
        ? accessContext.homeEntry.label
        : pendingSubmission.winnerEntryId === accessContext.awayEntry.id
          ? accessContext.awayEntry.label
          : "No winner selected";

    await sendMatchResultDisputeNotificationEmail({
      to: CONTACT_EMAIL,
      submittedByName: submittedByEntry.label,
      submittedByEmail: getEntryEmailRecipients(submittedByEntry).join(", ") || null,
      disputedByName: disputedByEntry.label,
      disputedByEmail: getEntryEmailRecipients(disputedByEntry).join(", ") || currentUser.email,
      matchId: accessContext.match.id,
      tournamentName: accessContext.match.tournamentName,
      venueLabel: accessContext.match.venueLabel,
      scheduledAtLabel: formatScheduledAtLabel(accessContext.match.matchDate, accessContext.match.matchTime),
      homeEntryLabel: accessContext.homeEntry.label,
      awayEntryLabel: accessContext.awayEntry.label,
      homeScore: pendingSubmission.homeScore,
      awayScore: pendingSubmission.awayScore,
      winnerLabel,
      frameHighBreaks: frames,
      disputeReason,
      adminEditUrl: `${origin}/admin/tournaments/${accessContext.match.tournamentId}/matches/${accessContext.match.id}/edit`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/my-matches/[id]/submission/dispute error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to dispute the submitted match result.",
      },
      { status: 500 }
    );
  }
}