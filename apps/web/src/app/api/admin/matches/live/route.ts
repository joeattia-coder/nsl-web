import { NextResponse } from "next/server";
import {
  buildTournamentAdminPermissionScopes,
  hasAnyAdminPermission,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";
import type { AdminMatchesLiveResponse } from "@/lib/live-match";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
    }

    if (!hasAnyAdminPermission(currentUser, "matches.view")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const matches = await prisma.match.findMany({
      select: {
        id: true,
        tournamentId: true,
        homeScore: true,
        awayScore: true,
        matchDate: true,
        updatedAt: true,
        venue: {
          select: {
            venueName: true,
          },
        },
        tournament: {
          select: {
            seasonId: true,
            season: {
              select: {
                leagueId: true,
              },
            },
          },
        },
      },
    });

    const response: AdminMatchesLiveResponse = {
      items: matches
        .filter((match) =>
          hasScopedAdminPermission(
            currentUser,
            "matches.view",
            buildTournamentAdminPermissionScopes(
              match.tournamentId,
              match.tournament.seasonId,
              match.tournament.season.leagueId
            )
          )
        )
        .map((match) => ({
          id: match.id,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          venueName: match.venue?.venueName ?? "",
          matchDate: match.matchDate ? match.matchDate.toISOString() : "",
          updatedAt: match.updatedAt.toISOString(),
        })),
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json(response, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("GET /api/admin/matches/live error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch live admin matches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}