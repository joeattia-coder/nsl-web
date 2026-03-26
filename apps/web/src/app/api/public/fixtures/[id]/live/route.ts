import { prisma } from "@/lib/prisma";
import type { PublicLiveMatchResponse } from "@/lib/live-match";
import { publicApiNoStoreJson, publicApiOptions } from "@/lib/public-api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return publicApiOptions();
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
      },
    });

    if (!match) {
      return publicApiNoStoreJson({ error: "Fixture not found" }, { status: 404 });
    }

    const response: PublicLiveMatchResponse = {
      item: {
        id: match.id,
        fixtureGroupIdentifier: match.tournamentId,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        matchStatus: match.matchStatus,
        scheduleStatus: match.scheduleStatus,
        publicNote: match.publicNote,
        updatedAt: match.updatedAt.toISOString(),
      },
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