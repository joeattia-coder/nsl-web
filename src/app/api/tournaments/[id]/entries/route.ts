import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await context.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const entries = await prisma.tournamentEntry.findMany({
      where: { tournamentId },
      include: {
        members: {
          include: {
            player: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/tournaments/[id]/entries error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tournament entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await context.params;
    const body = await request.json();

    const { playerId, playerIds, entryName, seedNumber } = body;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const submittedPlayerIds: string[] = Array.isArray(playerIds)
      ? playerIds
      : playerId
      ? [playerId]
      : [];

    if (submittedPlayerIds.length === 0) {
      return NextResponse.json(
        { error: "At least one playerId is required" },
        { status: 400 }
      );
    }

    const uniquePlayerIds = [...new Set(submittedPlayerIds)];

    const expectedCounts: Record<string, number | null> = {
      SINGLES: 1,
      DOUBLES: 2,
      TRIPLES: 3,
      TEAM: null,
    };

    const expectedCount = expectedCounts[tournament.participantType];

    if (expectedCount !== null && uniquePlayerIds.length !== expectedCount) {
      return NextResponse.json(
        {
          error: `This tournament requires exactly ${expectedCount} player(s) per entry`,
        },
        { status: 400 }
      );
    }

    if (expectedCount === null && uniquePlayerIds.length < 1) {
      return NextResponse.json(
        { error: "Team entries must contain at least one player" },
        { status: 400 }
      );
    }

    const players = await prisma.player.findMany({
      where: {
        id: {
          in: uniquePlayerIds,
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    if (players.length !== uniquePlayerIds.length) {
      return NextResponse.json(
        { error: "One or more players were not found" },
        { status: 404 }
      );
    }

    if (tournament.participantType === "SINGLES") {
      const existingMember = await prisma.tournamentEntryMember.findFirst({
        where: {
          playerId: uniquePlayerIds[0],
          tournamentEntry: {
            tournamentId,
          },
        },
        include: {
          tournamentEntry: true,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "This player is already assigned to the tournament" },
          { status: 400 }
        );
      }
    }

    const generatedEntryName =
      entryName ??
      players
        .map((player) => `${player.firstName} ${player.lastName}`.trim())
        .join(" / ");

    const entry = await prisma.tournamentEntry.create({
      data: {
        tournamentId,
        entryName: generatedEntryName,
        seedNumber: seedNumber ?? null,
        members: {
          create: uniquePlayerIds.map((playerIdValue) => ({
            playerId: playerIdValue,
          })),
        },
      },
      include: {
        members: {
          include: {
            player: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/tournaments/[id]/entries error:", error);

    return NextResponse.json(
      {
        error: "Failed to create tournament entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}