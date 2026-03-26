import { NextResponse } from "next/server";
import {
  getTournamentAdminPermissionScopes,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";
import type { TournamentMatchesLiveResponse } from "@/lib/live-match";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function formatParticipantTypeLabel(entry: {
  entryName: string | null;
  members: Array<{
    player: {
      firstName: string;
      middleInitial: string | null;
      lastName: string;
    };
  }>;
} | null) {
  if (!entry) {
    return "";
  }

  if (entry.entryName?.trim()) {
    return entry.entryName.trim();
  }

  const names = entry.members.map(({ player }) =>
    [player.firstName, player.middleInitial, player.lastName].filter(Boolean).join(" ")
  );

  return names.join(" / ") || "Unnamed Entry";
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const { id: tournamentId } = await context.params;
    const permissionScopes = await getTournamentAdminPermissionScopes(tournamentId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404, headers: NO_STORE_HEADERS });
    }

    if (!hasScopedAdminPermission(currentUser, "matches.view", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403, headers: NO_STORE_HEADERS });
    }

    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
      },
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        matchDate: true,
        matchTime: true,
        matchStatus: true,
        scheduleStatus: true,
        bestOfFrames: true,
        updatedAt: true,
        venue: {
          select: {
            venueName: true,
          },
        },
        winnerEntry: {
          select: {
            entryName: true,
            members: {
              include: {
                player: {
                  select: {
                    firstName: true,
                    middleInitial: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const response: TournamentMatchesLiveResponse = {
      items: matches.map((match) => ({
        id: match.id,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        winnerName: formatParticipantTypeLabel(match.winnerEntry),
        bestOfFrames: match.bestOfFrames ?? 5,
        matchDate: match.matchDate ? match.matchDate.toISOString() : "",
        matchTime: match.matchTime ?? "",
        matchStatus: match.matchStatus,
        scheduleStatus: match.scheduleStatus,
        venueName: match.venue?.venueName ?? "",
        updatedAt: match.updatedAt.toISOString(),
      })),
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json(response, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("GET /api/admin/tournaments/[id]/matches/live error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch live tournament matches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}