import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentGroupId } = await context.params;

    const group = await prisma.tournamentGroup.findUnique({
      where: { id: tournamentGroupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const entries = await prisma.groupParticipant.findMany({
      where: { tournamentGroupId },
      include: {
        tournamentEntry: {
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
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/groups/[id]/entries error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch group entries",
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
    const { id: tournamentGroupId } = await context.params;
    const body = await request.json();

    const { tournamentEntryId } = body;

    if (!tournamentEntryId) {
      return NextResponse.json(
        { error: "tournamentEntryId is required" },
        { status: 400 }
      );
    }

    const group = await prisma.tournamentGroup.findUnique({
      where: { id: tournamentGroupId },
      include: {
        stageRound: {
          include: {
            tournamentStage: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const entry = await prisma.tournamentEntry.findUnique({
      where: { id: tournamentEntryId },
      include: {
        members: {
          include: {
            player: true,
          },
        },
        tournament: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Tournament entry not found" },
        { status: 404 }
      );
    }

    const groupTournamentId = group.stageRound.tournamentStage.tournamentId;

    if (entry.tournamentId !== groupTournamentId) {
      return NextResponse.json(
        {
          error: "This entry does not belong to the same tournament as the group",
        },
        { status: 400 }
      );
    }

    const existingAssignment = await prisma.groupParticipant.findUnique({
      where: {
        tournamentGroupId_tournamentEntryId: {
          tournamentGroupId,
          tournamentEntryId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "This entry is already assigned to the group" },
        { status: 400 }
      );
    }

    const assignment = await prisma.groupParticipant.create({
      data: {
        tournamentGroupId,
        tournamentEntryId,
      },
      include: {
        tournamentEntry: {
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
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups/[id]/entries error:", error);

    return NextResponse.json(
      {
        error: "Failed to assign entry to group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}