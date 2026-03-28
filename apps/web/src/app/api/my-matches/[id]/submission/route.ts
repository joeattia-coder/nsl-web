import { NextResponse } from "next/server";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { deriveMatchResultFromLiveSession } from "@/lib/live-session-match-result";
import {
  determineWinnerEntryId,
  formatScheduledAtLabel,
  getRequestOrigin,
  normalizeFrameHighBreaks,
} from "@/lib/match-result-submissions";
import {
  createMatchResultSubmission,
  deleteMatchResultSubmission,
  getPendingMatchResultSubmissionForMatch,
} from "@/lib/match-result-submission-store";
import { sendMatchResultApprovalRequestEmail } from "@/lib/email";
import {
  getEntryEmailRecipients,
  getEntryPrimaryEmail,
  getEntryParticipantNames,
  getPlayerMatchAccessContext,
} from "@/lib/player-match-access";
import { prisma } from "@/lib/prisma";
import { parseDateTimeInTimeZone } from "@/lib/timezone";

type SubmissionRequestBody = {
  source?: "manual" | "liveSession";
  startDateTime?: string | null;
  endDateTime?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  winnerEntryId?: string | null;
  homeHighBreaks?: Array<number | null>;
  awayHighBreaks?: Array<number | null>;
  summaryNote?: string | null;
};

function isNonNegativeWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

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

    const body = (await request.json().catch(() => null)) as SubmissionRequestBody | null;

    const submissionSource = body?.source === "liveSession" ? "liveSession" : "manual";

    const bestOfFrames = accessContext.match.bestOfFrames ?? 5;
    let validatedHomeScore: number;
    let validatedAwayScore: number;
    let startDateTime = "";
    let endDateTime = "";
    let summaryNote: string | null = null;
    let normalizedFrames;
    let submittedWinnerEntryId: string | null | undefined;

    if (submissionSource === "liveSession") {
      const liveSession = await prisma.matchLiveSession.findUnique({
        where: {
          matchId: id,
        },
        select: {
          scoringState: true,
          lastSyncedAt: true,
        },
      });

      const derivedResult = liveSession
        ? deriveMatchResultFromLiveSession({
            scoringState: liveSession.scoringState,
            homeEntryId: accessContext.homeEntry.id,
            awayEntryId: accessContext.awayEntry.id,
            completedAt: liveSession.lastSyncedAt.toISOString(),
          })
        : null;

      if (!derivedResult || !derivedResult.isComplete || !derivedResult.winnerEntryId) {
        return NextResponse.json({ error: "A completed live scoring session is required before submitting the official result." }, { status: 409 });
      }

      validatedHomeScore = derivedResult.homeScore;
      validatedAwayScore = derivedResult.awayScore;
      startDateTime = derivedResult.startedAt ?? "";
      endDateTime = derivedResult.completedAt ?? "";
      summaryNote = "Submitted from the live scoring session.";
      normalizedFrames = derivedResult.frames;
      submittedWinnerEntryId = derivedResult.winnerEntryId;
    } else {
      if (!body) {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
      }

      const homeScore = body.homeScore;
      const awayScore = body.awayScore;
      startDateTime = String(body.startDateTime ?? "").trim();
      endDateTime = String(body.endDateTime ?? "").trim();
      summaryNote = String(body.summaryNote ?? "").trim() || null;
      submittedWinnerEntryId = body.winnerEntryId ?? null;

      if (!isNonNegativeWholeNumber(homeScore)) {
        return NextResponse.json({ error: "Home score must be a whole number greater than or equal to 0." }, { status: 400 });
      }

      if (!isNonNegativeWholeNumber(awayScore)) {
        return NextResponse.json({ error: "Away score must be a whole number greater than or equal to 0." }, { status: 400 });
      }

      validatedHomeScore = homeScore;
      validatedAwayScore = awayScore;

      if (
        !Array.isArray(body.homeHighBreaks) ||
        !Array.isArray(body.awayHighBreaks) ||
        body.homeHighBreaks.length !== bestOfFrames ||
        body.awayHighBreaks.length !== bestOfFrames
      ) {
        return NextResponse.json(
          { error: "Frame high break arrays must match the number of frames in the match format." },
          { status: 400 }
        );
      }

      normalizedFrames = normalizeFrameHighBreaks(body.homeHighBreaks, body.awayHighBreaks);

      if (normalizedFrames.length !== bestOfFrames) {
        return NextResponse.json(
          { error: "Frame high break arrays must match the number of frames in the match format." },
          { status: 400 }
        );
      }
    }

    const framesNeededToWin = Math.floor(bestOfFrames / 2) + 1;
    const derivedWinnerEntryId = determineWinnerEntryId({
      homeScore: validatedHomeScore,
      awayScore: validatedAwayScore,
      homeEntryId: accessContext.homeEntry.id,
      awayEntryId: accessContext.awayEntry.id,
      winnerEntryId: submittedWinnerEntryId ?? null,
      framesNeededToWin,
    });

    if (!derivedWinnerEntryId) {
      return NextResponse.json(
        { error: "Winner must be selected or implied by a completed scoreline." },
        { status: 400 }
      );
    }

    const recipientEmails = getEntryEmailRecipients(accessContext.opponentEntry);

    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "Your opponent does not have a deliverable email address on file." },
        { status: 400 }
      );
    }

    const existingPending = await getPendingMatchResultSubmissionForMatch(id);

    if (existingPending?.targetEntryId === accessContext.currentEntry.id) {
      return NextResponse.json(
        { error: "Your opponent has already submitted a result for your approval." },
        { status: 409 }
      );
    }

    if (existingPending?.submittedByEntryId === accessContext.currentEntry.id) {
      await deleteMatchResultSubmission(existingPending.id);
    }

    const proposedMatchTime = startDateTime ? startDateTime.slice(11, 16) : null;
    const proposedMatchDate = startDateTime ? parseDateTimeInTimeZone(startDateTime) : null;
    const proposedEndedAt = endDateTime ? parseDateTimeInTimeZone(endDateTime) : null;

    await createMatchResultSubmission({
      matchId: id,
      submittedByUserId: currentUser.id,
      submittedByPlayerId: currentUser.linkedPlayerId,
      submittedByEntryId: accessContext.currentEntry.id,
      targetEntryId: accessContext.opponentEntry.id,
      winnerEntryId: derivedWinnerEntryId,
      homeScore: validatedHomeScore,
      awayScore: validatedAwayScore,
      summaryNote,
      proposedMatchDate,
      proposedMatchTime,
      proposedEndedAt,
      frames: normalizedFrames,
    });

    const origin = getRequestOrigin(request);
    const winnerLabel =
      derivedWinnerEntryId === accessContext.homeEntry.id
        ? accessContext.homeEntry.label
        : accessContext.awayEntry.label;

    await sendMatchResultApprovalRequestEmail({
      to: recipientEmails.join(", "),
      recipientName: getEntryPrimaryEmail(accessContext.opponentEntry) ? getEntryParticipantNames(accessContext.opponentEntry)[0] : null,
      submittedByName: currentUser.displayName,
      matchId: accessContext.match.id,
      tournamentName: accessContext.match.tournamentName,
      venueLabel: accessContext.match.venueLabel,
      scheduledAtLabel: formatScheduledAtLabel(accessContext.match.matchDate, accessContext.match.matchTime),
      homeEntryLabel: accessContext.homeEntry.label,
      awayEntryLabel: accessContext.awayEntry.label,
      homeScore: validatedHomeScore,
      awayScore: validatedAwayScore,
      winnerLabel,
      frameHighBreaks: normalizedFrames,
      reviewUrl: `${origin}/my-matches`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/my-matches/[id]/submission error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit the match result.",
      },
      { status: 500 }
    );
  }
}