import { NextResponse } from "next/server";
import { resolveCurrentAdminUser } from "@/lib/admin-auth";
import type { AdminPlayersLiveResponse } from "@/lib/live-match";
import { prisma } from "@/lib/prisma";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

function buildFullName(firstName: string, middleInitial: string | null, lastName: string) {
  return [firstName, middleInitial, lastName].filter(Boolean).join(" ");
}

export async function GET() {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const players = await prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        emailAddress: true,
        phoneNumber: true,
        country: true,
        photoUrl: true,
        userId: true,
        entryMembers: {
          select: {
            tournamentEntry: {
              select: {
                tournament: {
                  select: {
                    id: true,
                    tournamentName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const response: AdminPlayersLiveResponse = {
      items: players.map((player) => ({
        id: player.id,
        fullName: buildFullName(player.firstName, player.middleInitial, player.lastName),
        email: player.emailAddress ?? "",
        phoneNumber: player.phoneNumber ?? "",
        country: player.country ?? "",
        photoUrl: player.photoUrl ?? "",
        linkedUserId: player.userId ?? null,
        tournaments: Array.from(
          new Map(
            player.entryMembers.map((member) => [
              member.tournamentEntry.tournament.id,
              {
                id: member.tournamentEntry.tournament.id,
                name: member.tournamentEntry.tournament.tournamentName,
              },
            ])
          ).values()
        ).sort((left, right) => left.name.localeCompare(right.name)),
      })),
      serverTime: new Date().toISOString(),
    };

    return NextResponse.json(response, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("GET /api/admin/players/live error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch live admin players",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}