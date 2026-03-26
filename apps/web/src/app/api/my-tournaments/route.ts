import { NextResponse } from "next/server";

import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type TournamentRow = {
  id: string;
  tournamentName: string;
  status: string;
  seasonName: string | null;
  venueName: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  description: string | null;
  snookerFormat: string | null;
  participantType: string;
};

function sortTournamentRows(left: TournamentRow, right: TournamentRow) {
  const activeWeight = (status: string) => {
    if (status === "IN_PROGRESS") return 0;
    if (status === "REGISTRATION_OPEN") return 1;
    if (status === "REGISTRATION_CLOSED") return 2;
    if (status === "COMPLETED") return 3;
    if (status === "CANCELLED") return 4;
    return 5;
  };

  const statusDifference = activeWeight(left.status) - activeWeight(right.status);

  if (statusDifference !== 0) {
    return statusDifference;
  }

  const leftDate = left.startDate ? new Date(left.startDate).getTime() : Number.MAX_SAFE_INTEGER;
  const rightDate = right.startDate ? new Date(right.startDate).getTime() : Number.MAX_SAFE_INTEGER;

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  return left.tournamentName.localeCompare(right.tournamentName, undefined, {
    sensitivity: "base",
  });
}

export async function GET() {
  try {
    const currentUser = await resolveCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!currentUser.linkedPlayerId) {
      return NextResponse.json({ error: "Your account is not linked to a player profile." }, { status: 403 });
    }

    const memberships = await prisma.tournamentEntryMember.findMany({
      where: {
        playerId: currentUser.linkedPlayerId,
      },
      select: {
        tournamentEntry: {
          select: {
            tournament: {
              select: {
                id: true,
                tournamentName: true,
                status: true,
                startDate: true,
                endDate: true,
                registrationDeadline: true,
                description: true,
                snookerFormat: true,
                participantType: true,
                season: {
                  select: {
                    seasonName: true,
                  },
                },
                venue: {
                  select: {
                    venueName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const tournaments = Array.from(
      new Map(
        memberships.map((membership) => {
          const tournament = membership.tournamentEntry.tournament;

          return [
            tournament.id,
            {
              id: tournament.id,
              tournamentName: tournament.tournamentName,
              status: tournament.status,
              seasonName: tournament.season.seasonName,
              venueName: tournament.venue?.venueName ?? null,
              startDate: tournament.startDate?.toISOString() ?? null,
              endDate: tournament.endDate?.toISOString() ?? null,
              registrationDeadline: tournament.registrationDeadline?.toISOString() ?? null,
              description: tournament.description?.trim() || null,
              snookerFormat: tournament.snookerFormat,
              participantType: tournament.participantType,
            } satisfies TournamentRow,
          ] as const;
        })
      ).values()
    ).sort(sortTournamentRows);

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error("GET /api/my-tournaments error:", error);

    return NextResponse.json(
      {
        error: "Failed to load your tournaments.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}