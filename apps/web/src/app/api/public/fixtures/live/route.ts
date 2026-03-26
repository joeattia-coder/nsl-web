import { prisma } from "@/lib/prisma";
import type { PublicLiveMatchListResponse } from "@/lib/live-match";
import { publicApiNoStoreJson, publicApiOptions } from "@/lib/public-api-response";

export function OPTIONS() {
  return publicApiOptions();
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
      },
    });

    const response: PublicLiveMatchListResponse = {
      items: matches.map((match) => ({
        id: match.id,
        fixtureGroupIdentifier: match.tournamentId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        matchStatus: match.matchStatus,
        scheduleStatus: match.scheduleStatus,
        publicNote: match.publicNote,
        updatedAt: match.updatedAt.toISOString(),
      })),
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