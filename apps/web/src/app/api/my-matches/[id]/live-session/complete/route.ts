import { NextResponse } from "next/server";
import { MatchLiveEventType, Prisma } from "@/generated/prisma/client";

import { resolveCurrentUser } from "@/lib/admin-auth";
import { deriveMatchResultFromLiveSession, parseLiveScoringState } from "@/lib/live-session-match-result";
import { persistOfficialMatchResult } from "@/lib/match-finalization";
import { recalculateAndPersistPlayerElo } from "@/lib/player-elo";
import { getPlayerMatchAccessContext } from "@/lib/player-match-access";
import { prisma } from "@/lib/prisma";
import { formatDateInAdminTimeZone } from "@/lib/timezone";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const sessionSelect = {
  id: true,
  matchId: true,
  status: true,
  version: true,
  scoringState: true,
  homeFramesWon: true,
  awayFramesWon: true,
  currentFrameNumber: true,
  currentFrameHomePoints: true,
  currentFrameAwayPoints: true,
  activeSide: true,
  homeStartedAt: true,
  awayStartedAt: true,
  homeCompletedAt: true,
  awayCompletedAt: true,
  finalizedAt: true,
  lastSyncedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function shouldAllowAdminOverride(value: unknown, isAdmin: boolean) {
  return isAdmin && value === true;
}

function mapSession(session: {
  id: string;
  matchId: string;
  status: string;
  version: number;
  scoringState: Prisma.JsonValue | null;
  homeFramesWon: number | null;
  awayFramesWon: number | null;
  currentFrameNumber: number | null;
  currentFrameHomePoints: number | null;
  currentFrameAwayPoints: number | null;
  activeSide: string | null;
  homeStartedAt: Date | null;
  awayStartedAt: Date | null;
  homeCompletedAt: Date | null;
  awayCompletedAt: Date | null;
  finalizedAt: Date | null;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: session.id,
    matchId: session.matchId,
    status: session.status,
    version: session.version,
    scoringState: session.scoringState,
    summary: {
      homeScore: session.homeFramesWon,
      awayScore: session.awayFramesWon,
      currentFrameNumber: session.currentFrameNumber,
      currentFrameHomePoints: session.currentFrameHomePoints,
      currentFrameAwayPoints: session.currentFrameAwayPoints,
      activeSide: session.activeSide === "home" || session.activeSide === "away" ? session.activeSide : null,
    },
    participants: {
      home: {
        startedAt: session.homeStartedAt?.toISOString() ?? null,
        completedAt: session.homeCompletedAt?.toISOString() ?? null,
      },
      away: {
        startedAt: session.awayStartedAt?.toISOString() ?? null,
        completedAt: session.awayCompletedAt?.toISOString() ?? null,
      },
    },
    finalizedAt: session.finalizedAt?.toISOString() ?? null,
    lastSyncedAt: session.lastSyncedAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

async function getAuthorizedContext(matchId: string) {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  if (!currentUser.linkedPlayerId) {
    return { error: NextResponse.json({ error: "Your account is not linked to a player profile." }, { status: 403 }) };
  }

  const accessContext = await getPlayerMatchAccessContext(matchId, currentUser.linkedPlayerId);

  if (!accessContext) {
    return { error: NextResponse.json({ error: "Match not found." }, { status: 404 }) };
  }

  return { currentUser, accessContext };
}

function toCurrentSide(accessContext: NonNullable<Awaited<ReturnType<typeof getAuthorizedContext>>["accessContext"]>) {
  return accessContext.currentEntry.id === accessContext.homeEntry.id ? "home" : "away";
}

function parseIsoDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(_request: Request, context: RouteContext) {

function getCurrentFrameSummary(scoringState: NonNullable<ReturnType<typeof parseLiveScoringState>>) {
  const fallbackIndex = Math.max(0, scoringState.frames.length - 1);
  const currentFrameIndex = typeof scoringState.currentFrameIndex === "number"
    ? Math.min(Math.max(scoringState.currentFrameIndex, 0), fallbackIndex)
    : fallbackIndex;
  const currentFrame = scoringState.frames[currentFrameIndex] ?? scoringState.frames[fallbackIndex] ?? null;

  return {
    currentFrameNumber: currentFrame?.frameNumber ?? null,
    currentFrameHomePoints: currentFrame?.homePoints ?? null,
    currentFrameAwayPoints: currentFrame?.awayPoints ?? null,
    activeSide: currentFrame?.activeSide ?? null,
  };
}
  try {
    const { id } = await context.params;
    const authorization = await getAuthorizedContext(id);

    if (authorization.error) {
      return authorization.error;
    }

    const currentSide = toCurrentSide(authorization.accessContext);
    const currentCompleteField = currentSide === "home" ? "homeCompletedAt" : "awayCompletedAt";
    const body = await readJsonBody(_request);
    const adminOverride = shouldAllowAdminOverride(isRecord(body) ? body.adminOverride : null, authorization.currentUser.isAdmin);
    const submittedScoringState = isRecord(body) ? body.scoringState : null;

    const liveSession = await prisma.matchLiveSession.findUnique({
      where: {
        matchId: id,
      },
      select: sessionSelect,
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found." }, { status: 404 });
    }

    if (liveSession.finalizedAt) {
      return NextResponse.json({ session: mapSession(liveSession), finalized: true });
    }

    if (!adminOverride && (!liveSession.homeStartedAt || !liveSession.awayStartedAt)) {
      return NextResponse.json({ error: "Both players must start the match before it can be completed.", session: mapSession(liveSession) }, { status: 409 });
    }

    const scoringStateSource = submittedScoringState ?? liveSession.scoringState;
    const parsedSubmittedScoringState = parseLiveScoringState(scoringStateSource);

    if (!parsedSubmittedScoringState) {
      return NextResponse.json({ error: "A valid final scoring snapshot is required to complete the match.", session: mapSession(liveSession) }, { status: 400 });
    }

    const derivedResult = deriveMatchResultFromLiveSession({
      scoringState: parsedSubmittedScoringState,
      homeEntryId: authorization.accessContext.homeEntry.id,
      awayEntryId: authorization.accessContext.awayEntry.id,
      completedAt: liveSession.lastSyncedAt.toISOString(),
    });

    if (!derivedResult || !derivedResult.isComplete || !derivedResult.winnerEntryId) {
      return NextResponse.json({ error: "The live scoring session must be complete before ending the match.", session: mapSession(liveSession) }, { status: 409 });
    }

    const now = new Date();
    const finalSyncedAt = parseIsoDate(derivedResult.completedAt) ?? now;
    const currentFrameSummary = getCurrentFrameSummary(parsedSubmittedScoringState);

    const result = await prisma.$transaction(async (tx) => {
      const updatedSession = await tx.matchLiveSession.update({
        where: {
          id: liveSession.id,
        },
        data: {
          [currentCompleteField]: liveSession[currentCompleteField] ?? now,
          status: "COMPLETED",
          version: {
            increment: 1,
          },
          scoringState: parsedSubmittedScoringState as Prisma.InputJsonValue,
          homeFramesWon: derivedResult.homeScore,
          awayFramesWon: derivedResult.awayScore,
          currentFrameNumber: currentFrameSummary.currentFrameNumber,
          currentFrameHomePoints: currentFrameSummary.currentFrameHomePoints,
          currentFrameAwayPoints: currentFrameSummary.currentFrameAwayPoints,
          activeSide: currentFrameSummary.activeSide,
          lastSyncedAt: finalSyncedAt,
          updatedByUserId: authorization.currentUser.id,
          events: {
            create: {
              version: liveSession.version + 1,
              eventType: MatchLiveEventType.STATUS_CHANGED,
              payload: {
                action: "participant_completed",
                side: currentSide,
                finalizedFromScorer: true,
              } as Prisma.InputJsonValue,
              createdByUserId: authorization.currentUser.id,
            },
          },
        },
        select: sessionSelect,
      });

      const startedAt = parseIsoDate(derivedResult.startedAt);
      const completedAt = parseIsoDate(derivedResult.completedAt);

      await persistOfficialMatchResult({
        tx,
        matchId: id,
        currentUserId: authorization.currentUser.id,
        enteredByUserId: authorization.currentUser.id,
        matchDate: startedAt,
        matchTime: startedAt ? formatDateInAdminTimeZone(startedAt, { hour: "2-digit", minute: "2-digit", hour12: false }) : null,
        homeScore: derivedResult.homeScore,
        awayScore: derivedResult.awayScore,
        winnerEntryId: derivedResult.winnerEntryId,
        resultSubmittedAt: completedAt,
        frames: derivedResult.frames.map((frame) => ({
          frameNumber: frame.frameNumber,
          winnerEntryId: frame.winnerEntryId,
          homePoints: frame.homePoints,
          awayPoints: frame.awayPoints,
          homeHighBreak: frame.homeHighBreak,
          awayHighBreak: frame.awayHighBreak,
        })),
        liveSession: {
          sessionId: liveSession.id,
          finalize: true,
        },
      });

      const finalizedSession = await tx.matchLiveSession.findUniqueOrThrow({
        where: {
          matchId: id,
        },
        select: sessionSelect,
      });

      return {
        session: finalizedSession,
        finalized: true,
      };
    });

    if (result.finalized) {
      await recalculateAndPersistPlayerElo(prisma);
    }

    return NextResponse.json({
      session: mapSession(result.session),
      finalized: result.finalized,
    });
  } catch (error) {
    console.error("POST /api/my-matches/[id]/live-session/complete error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to complete the live-scored match.",
      },
      { status: 500 }
    );
  }
}