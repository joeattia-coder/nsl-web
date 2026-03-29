import { prisma } from "@/lib/prisma";
import type { PublicLiveMatchListResponse } from "@/lib/live-match";
import { publicApiNoStoreJson, publicApiOptions } from "@/lib/public-api-response";

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

function getVisibleLiveSession<T extends { homeStartedAt: Date | null; awayStartedAt: Date | null }>(liveSession: T | null) {
  if (!liveSession?.homeStartedAt && !liveSession?.awayStartedAt) {
    return null;
  }

  return liveSession;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const groupId = url.searchParams.get("group")?.trim() ?? "";

    const matches = await prisma.match.findMany({
      where: {
        tournament: {
          isPublished: true,
        },
        ...(groupId ? { tournamentId: groupId } : {}),
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
            homeStartedAt: true,
            awayStartedAt: true,
            lastSyncedAt: true,
          },
        },
      },
    });

    const response: PublicLiveMatchListResponse = {
      items: matches.map((match) => {
        const liveSession = getVisibleLiveSession(match.liveSession);

        return {
        id: match.id,
        fixtureGroupIdentifier: match.tournamentId,
        homeScore: liveSession?.homeFramesWon ?? match.homeScore,
        awayScore: liveSession?.awayFramesWon ?? match.awayScore,
        matchStatus: getPublicMatchStatus(match.matchStatus, liveSession?.status ?? null),
        scheduleStatus: match.scheduleStatus,
        publicNote: match.publicNote,
        liveSessionStatus: liveSession?.status ?? null,
        currentFrameNumber: liveSession?.currentFrameNumber ?? null,
        currentFrameHomePoints: liveSession?.currentFrameHomePoints ?? null,
        currentFrameAwayPoints: liveSession?.currentFrameAwayPoints ?? null,
        activeSide:
          liveSession?.activeSide === "home" || liveSession?.activeSide === "away"
            ? liveSession.activeSide
            : null,
        updatedAt: (liveSession?.lastSyncedAt ?? match.updatedAt).toISOString(),
      };
      }),
      serverTime: new Date().toISOString(),
    };

    return publicApiNoStoreJson(response);
  } catch (error) {
    console.error("GET /api/public/fixtures/live error:", error);

    return publicApiNoStoreJson(
      {
        error: "Failed to fetch live fixtures",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}