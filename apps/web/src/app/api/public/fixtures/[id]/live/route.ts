import { prisma } from "@/lib/prisma";
import type { PublicLiveMatchResponse } from "@/lib/live-match";
import { derivePublicLiveBroadcastState } from "@/lib/public-live-broadcast";
import { publicApiNoStoreJson, publicApiOptions } from "@/lib/public-api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return publicApiOptions();
}

function getPublicMatchStatus(matchStatus: string, liveSessionStatus: string | null) {
  if (liveSessionStatus === "ACTIVE" || liveSessionStatus === "PAUSED") {
    return "IN_PROGRESS";
  }

  if (liveSessionStatus === "COMPLETED") {
    return "COMPLETED";
  }

  if (liveSessionStatus === "ABANDONED") {
    return "ABANDONED";
  }

  return matchStatus;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const match = await prisma.match.findFirst({
      where: {
        id,
        tournament: {
          isPublished: true,
        },
      },
      select: {
        id: true,
        tournamentId: true,
        homeScore: true,
        awayScore: true,
        matchStatus: true,
        scheduleStatus: true,
        publicNote: true,
        updatedAt: true,
        liveSession: {
          select: {
            status: true,
            homeFramesWon: true,
            awayFramesWon: true,
            currentFrameNumber: true,
            currentFrameHomePoints: true,
            currentFrameAwayPoints: true,
            activeSide: true,
            scoringState: true,
            lastSyncedAt: true,
          },
        },
      },
    });

    if (!match) {
      return publicApiNoStoreJson({ error: "Fixture not found" }, { status: 404 });
    }

    const response: PublicLiveMatchResponse = {
      item: {
        id: match.id,
        fixtureGroupIdentifier: match.tournamentId,
        homeScore: match.liveSession?.homeFramesWon ?? match.homeScore,
        awayScore: match.liveSession?.awayFramesWon ?? match.awayScore,
        matchStatus: getPublicMatchStatus(match.matchStatus, match.liveSession?.status ?? null),
        scheduleStatus: match.scheduleStatus,
        publicNote: match.publicNote,
        liveSessionStatus: match.liveSession?.status ?? null,
        currentFrameNumber: match.liveSession?.currentFrameNumber ?? null,
        currentFrameHomePoints: match.liveSession?.currentFrameHomePoints ?? null,
        currentFrameAwayPoints: match.liveSession?.currentFrameAwayPoints ?? null,
        activeSide:
          match.liveSession?.activeSide === "home" || match.liveSession?.activeSide === "away"
            ? match.liveSession.activeSide
            : null,
        updatedAt: (match.liveSession?.lastSyncedAt ?? match.updatedAt).toISOString(),
      },
      details: match.liveSession?.scoringState ? derivePublicLiveBroadcastState(match.liveSession.scoringState) : null,
      serverTime: new Date().toISOString(),
    };

    return publicApiNoStoreJson(response);
  } catch (error) {
    console.error("GET /api/public/fixtures/[id]/live error:", error);

    return publicApiNoStoreJson(
      {
        error: "Failed to fetch live fixture",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}