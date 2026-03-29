import { NextResponse } from "next/server";
import { MatchLiveEventType, Prisma } from "@/generated/prisma/client";

import { resolveCurrentUser } from "@/lib/admin-auth";
import { getPlayerMatchAccessContext } from "@/lib/player-match-access";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type LiveSessionSummaryPayload = {
  homeScore: number;
  awayScore: number;
  currentFrameNumber: number;
  currentFrameHomePoints: number;
  currentFrameAwayPoints: number;
  activeSide: "home" | "away" | null;
  isComplete: boolean;
};

type LiveSessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";

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

function isInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value);
}

function isLiveSessionStatus(value: unknown): value is LiveSessionStatus {
  return value === "ACTIVE" || value === "PAUSED" || value === "COMPLETED" || value === "ABANDONED";
}

function shouldAllowAdminOverride(value: unknown, isAdmin: boolean) {
  return isAdmin && value === true;
}

function parseSummary(value: unknown): LiveSessionSummaryPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const activeSide = value.activeSide;

  if (
    !isInteger(value.homeScore) ||
    !isInteger(value.awayScore) ||
    !isInteger(value.currentFrameNumber) ||
    !isInteger(value.currentFrameHomePoints) ||
    !isInteger(value.currentFrameAwayPoints) ||
    typeof value.isComplete !== "boolean" ||
    !(activeSide === "home" || activeSide === "away" || activeSide === null)
  ) {
    return null;
  }

  return {
    homeScore: value.homeScore as number,
    awayScore: value.awayScore as number,
    currentFrameNumber: value.currentFrameNumber as number,
    currentFrameHomePoints: value.currentFrameHomePoints as number,
    currentFrameAwayPoints: value.currentFrameAwayPoints as number,
    activeSide,
    isComplete: value.isComplete as boolean,
  };
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
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

function getCurrentSide(authorization: Awaited<ReturnType<typeof getAuthorizedContext>>) {
  if (authorization.error) {
    return null;
  }

  return authorization.accessContext.currentEntry.id === authorization.accessContext.homeEntry.id ? "home" : "away";
}

function getParticipantStartField(side: "home" | "away") {
  return side === "home" ? "homeStartedAt" : "awayStartedAt";
}

function getParticipantCompleteField(side: "home" | "away") {
  return side === "home" ? "homeCompletedAt" : "awayCompletedAt";
}

function getOpponentSide(side: "home" | "away") {
  return side === "home" ? "away" : "home";
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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const authorization = await getAuthorizedContext(id);

    if (authorization.error) {
      return authorization.error;
    }

    const session = await prisma.matchLiveSession.findUnique({
      where: {
        matchId: id,
      },
      select: sessionSelect,
    });

    return NextResponse.json({
      session: session ? mapSession(session) : null,
    });
  } catch (error) {
    console.error("GET /api/my-matches/[id]/live-session error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch live session.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const authorization = await getAuthorizedContext(id);

    if (authorization.error) {
      return authorization.error;
    }

    const currentSide = getCurrentSide(authorization);

    if (!currentSide) {
      return authorization.error;
    }

    const body = await readJsonBody(request);
    const initialState = isRecord(body) && isRecord(body.initialState) ? body.initialState : null;
    const summary = isRecord(body) ? parseSummary(body.summary) : null;
    const requestedStatus = isRecord(body) ? body.status : null;

    const existingSession = await prisma.matchLiveSession.findUnique({
      where: {
        matchId: id,
      },
      select: sessionSelect,
    });

    if (existingSession) {
      if (existingSession.finalizedAt) {
        return NextResponse.json({ session: mapSession(existingSession) });
      }

      const startField = getParticipantStartField(currentSide);
      const completeField = getParticipantCompleteField(currentSide);

      if (existingSession[startField]) {
        return NextResponse.json({ session: mapSession(existingSession) });
      }

      const now = new Date();
      const session = await prisma.matchLiveSession.update({
        where: {
          id: existingSession.id,
        },
        data: {
          [startField]: now,
          [completeField]: null,
          updatedByUserId: authorization.currentUser.id,
          events: {
            create: {
              version: existingSession.version,
              eventType: MatchLiveEventType.STATUS_CHANGED,
              payload: {
                action: "participant_started",
                side: currentSide,
              } as Prisma.InputJsonValue,
              createdByUserId: authorization.currentUser.id,
            },
          },
        },
        select: sessionSelect,
      });

      return NextResponse.json({ session: mapSession(session) });
    }
    if (!initialState || !summary) {
      return NextResponse.json({ error: "Initial live scoring state is required." }, { status: 400 });
    }

    if (requestedStatus !== null && !isLiveSessionStatus(requestedStatus)) {
      return NextResponse.json({ error: "Invalid live session status." }, { status: 400 });
    }

    const session = await prisma.matchLiveSession.create({
      data: {
        matchId: id,
        status: (requestedStatus === "PAUSED" || requestedStatus === "ABANDONED" ? requestedStatus : "ACTIVE") as LiveSessionStatus,
        version: 1,
        scoringState: initialState as Prisma.InputJsonValue,
        homeFramesWon: summary.homeScore,
        awayFramesWon: summary.awayScore,
        currentFrameNumber: summary.currentFrameNumber,
        currentFrameHomePoints: summary.currentFrameHomePoints,
        currentFrameAwayPoints: summary.currentFrameAwayPoints,
        activeSide: summary.activeSide,
        homeStartedAt: currentSide === "home" ? new Date() : null,
        awayStartedAt: currentSide === "away" ? new Date() : null,
        createdByUserId: authorization.currentUser.id,
        updatedByUserId: authorization.currentUser.id,
        events: {
          create: {
            version: 1,
            eventType: MatchLiveEventType.SESSION_CREATED,
            payload: {
              summary,
              side: currentSide,
            } as Prisma.InputJsonValue,
            createdByUserId: authorization.currentUser.id,
          },
        },
      },
      select: sessionSelect,
    });

    return NextResponse.json({ session: mapSession(session) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/my-matches/[id]/live-session error:", error);

    return NextResponse.json(
      {
        error: "Failed to start live session.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const authorization = await getAuthorizedContext(id);

    if (authorization.error) {
      return authorization.error;
    }

    const body = await readJsonBody(request);

    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const summary = parseSummary(body.summary);
    const baseVersion = body.baseVersion;
    const scoringState = body.scoringState;
    const requestedStatus = body.status;
    const adminOverride = shouldAllowAdminOverride(body.adminOverride, authorization.currentUser.isAdmin);

    if (!isInteger(baseVersion)) {
      return NextResponse.json({ error: "A valid live session version is required." }, { status: 400 });
    }

    const currentVersion = baseVersion as number;

    if (currentVersion < 1) {
      return NextResponse.json({ error: "A valid live session version is required." }, { status: 400 });
    }

    if (!isRecord(scoringState) || !summary) {
      return NextResponse.json({ error: "A valid live scoring snapshot is required." }, { status: 400 });
    }

    if (requestedStatus !== undefined && !isLiveSessionStatus(requestedStatus)) {
      return NextResponse.json({ error: "Invalid live session status." }, { status: 400 });
    }

    const latestSession = await prisma.matchLiveSession.findUnique({
      where: {
        matchId: id,
      },
      select: sessionSelect,
    });

    if (!latestSession) {
      return NextResponse.json({ error: "Live session not found." }, { status: 404 });
    }

    if (latestSession.finalizedAt) {
      return NextResponse.json({ error: "This live session has already been finalized.", session: mapSession(latestSession) }, { status: 409 });
    }

    if (!adminOverride && (!latestSession.homeStartedAt || !latestSession.awayStartedAt)) {
      return NextResponse.json({ error: "Both players must start the match before scoring can sync.", session: mapSession(latestSession) }, { status: 409 });
    }

    const nextStatus = (requestedStatus === "PAUSED" || requestedStatus === "ABANDONED" ? requestedStatus : "ACTIVE") as LiveSessionStatus;

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.matchLiveSession.updateMany({
        where: {
          matchId: id,
          version: currentVersion,
        },
        data: {
          status: nextStatus,
          version: {
            increment: 1,
          },
          scoringState: scoringState as Prisma.InputJsonValue,
          homeFramesWon: summary.homeScore,
          awayFramesWon: summary.awayScore,
          currentFrameNumber: summary.currentFrameNumber,
          currentFrameHomePoints: summary.currentFrameHomePoints,
          currentFrameAwayPoints: summary.currentFrameAwayPoints,
          activeSide: summary.activeSide,
          lastSyncedAt: new Date(),
          updatedByUserId: authorization.currentUser.id,
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      const session = await tx.matchLiveSession.findUnique({
        where: {
          matchId: id,
        },
        select: sessionSelect,
      });

      if (!session) {
        return null;
      }

      await tx.matchLiveEvent.create({
        data: {
          sessionId: session.id,
          version: session.version,
          eventType: nextStatus === "ACTIVE" ? MatchLiveEventType.SNAPSHOT_SYNC : MatchLiveEventType.STATUS_CHANGED,
          payload: {
            summary,
            status: nextStatus,
          } as Prisma.InputJsonValue,
          createdByUserId: authorization.currentUser.id,
        },
      });

      return session;
    });

    if (!result) {
      const latestSession = await prisma.matchLiveSession.findUnique({
        where: {
          matchId: id,
        },
        select: sessionSelect,
      });

      return NextResponse.json(
        {
          error: latestSession ? "Live session version conflict." : "Live session not found.",
          session: latestSession ? mapSession(latestSession) : null,
        },
        { status: latestSession ? 409 : 404 }
      );
    }

    return NextResponse.json({ session: mapSession(result) });
  } catch (error) {
    console.error("PATCH /api/my-matches/[id]/live-session error:", error);

    return NextResponse.json(
      {
        error: "Failed to sync live session.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const authorization = await getAuthorizedContext(id);

    if (authorization.error) {
      return authorization.error;
    }

    const currentSide = getCurrentSide(authorization);

    if (!currentSide) {
      return authorization.error;
    }

    const session = await prisma.matchLiveSession.findUnique({
      where: {
        matchId: id,
      },
      select: sessionSelect,
    });

    if (!session) {
      return NextResponse.json({ ok: true, session: null });
    }

    if (session.finalizedAt) {
      return NextResponse.json(
        {
          error: "This live-scored match has already been finalized.",
          session: mapSession(session),
        },
        { status: 409 }
      );
    }

    const startField = getParticipantStartField(currentSide);
    const opponentStartField = getParticipantStartField(getOpponentSide(currentSide));

    if (session[opponentStartField]) {
      return NextResponse.json(
        {
          error: "The other player has already started this live match. Please ask an admin or official to reset it.",
          session: mapSession(session),
        },
        { status: 409 }
      );
    }

    if (!session[startField]) {
      return NextResponse.json({ ok: true, session: mapSession(session) });
    }

    await prisma.matchLiveSession.delete({
      where: {
        id: session.id,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        removed: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/my-matches/[id]/live-session error:", error);

    return NextResponse.json(
      {
        error: "Failed to reset live session.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}