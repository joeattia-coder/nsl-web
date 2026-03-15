import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      orderBy: [
        { startDate: "asc" },
        { tournamentName: "asc" },
      ],
    });

    const fixtureGroups = tournaments.map((tournament) => ({
      id: tournament.id,
      fixtureGroupIdentifier: tournament.id,
      fixtureGroupDesc: tournament.tournamentName,
      seasonId: tournament.seasonId,
    }));

    return NextResponse.json({
      count: fixtureGroups.length,
      fixtureGroups,
    });
  } catch (error) {
    console.error("Failed to load public fixture groups", error);

    return NextResponse.json(
      { error: "Failed to load public fixture groups" },
      { status: 500 }
    );
  }
}