import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        season: true,
        venue: true,
        stages: {
          orderBy: { sequence: "asc" },
          include: {
            rounds: {
              orderBy: { sequence: "asc" },
            },
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { tournamentName: "asc" },
      ],
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("GET /api/tournaments error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tournaments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      seasonId,
      venueId,
      tournamentName,
      participantType,
      startDate,
      endDate,
      status,
      isPublished,
      description,
    } = body;

    if (!seasonId) {
      return NextResponse.json(
        { error: "seasonId is required" },
        { status: 400 }
      );
    }

    if (!tournamentName) {
      return NextResponse.json(
        { error: "tournamentName is required" },
        { status: 400 }
      );
    }

    if (!participantType) {
      return NextResponse.json(
        { error: "participantType is required" },
        { status: 400 }
      );
    }

    const validParticipantTypes = ["SINGLES", "DOUBLES", "TRIPLES", "TEAM"];
    if (!validParticipantTypes.includes(participantType)) {
      return NextResponse.json(
        {
          error:
            "participantType must be one of SINGLES, DOUBLES, TRIPLES, TEAM",
        },
        { status: 400 }
      );
    }

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
    });

    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    if (venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
      });

      if (!venue) {
        return NextResponse.json(
          { error: "Venue not found" },
          { status: 404 }
        );
      }
    }

    const tournament = await prisma.tournament.create({
      data: {
        seasonId,
        venueId: venueId ?? null,
        tournamentName,
        participantType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status ?? "DRAFT",
        isPublished: isPublished ?? false,
        description: description ?? null,
      },
      include: {
        season: true,
        venue: true,
        stages: {
          orderBy: { sequence: "asc" },
          include: {
            rounds: {
              orderBy: { sequence: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("POST /api/tournaments error:", error);

    return NextResponse.json(
      {
        error: "Failed to create tournament",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}