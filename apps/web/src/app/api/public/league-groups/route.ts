import { publicApiJson } from "@/lib/public-api-response";
import { prisma } from "@/lib/prisma";
import { getPublicTournamentStandings } from "@/lib/public-standings";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        isPublished: true,
        matches: {
          some: {},
        },
      },
      select: {
        id: true,
        tournamentName: true,
        seasonId: true,
      },
      orderBy: [{ startDate: "asc" }, { tournamentName: "asc" }],
    });

    const groups = await Promise.all(
      tournaments.map(async (tournament) => ({
        id: tournament.id,
        fixtureGroupIdentifier: tournament.id,
        fixtureGroupDesc: tournament.tournamentName,
        seasonId: tournament.seasonId,
        standings: await getPublicTournamentStandings(tournament.id),
      }))
    );

    return publicApiJson({
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error("Failed to load public league groups", error);

    return publicApiJson(
      { error: "Failed to load public league groups" },
      { status: 500 }
    );
  }
}