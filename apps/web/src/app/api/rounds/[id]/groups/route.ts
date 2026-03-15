import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stageRoundId } = await context.params;

    const round = await prisma.stageRound.findUnique({
      where: { id: stageRoundId },
    });

    if (!round) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    const groups = await prisma.tournamentGroup.findMany({
      where: { stageRoundId },
      orderBy: { sequence: "asc" },
      include: {
        participants: {
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
        },
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("GET /api/rounds/[id]/groups error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch groups",
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
    const { id: stageRoundId } = await context.params;
    const body = await request.json();

    const { groupName, sequence } = body;

    if (!groupName) {
      return NextResponse.json(
        { error: "groupName is required" },
        { status: 400 }
      );
    }

    if (sequence === undefined || sequence === null) {
      return NextResponse.json(
        { error: "sequence is required" },
        { status: 400 }
      );
    }

    const round = await prisma.stageRound.findUnique({
      where: { id: stageRoundId },
    });

    if (!round) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404 }
      );
    }

    if (round.roundType !== "GROUP") {
      return NextResponse.json(
        { error: "Groups can only be created for GROUP rounds" },
        { status: 400 }
      );
    }

    const group = await prisma.tournamentGroup.create({
      data: {
        stageRoundId,
        groupName,
        sequence,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("POST /api/rounds/[id]/groups error:", error);

    return NextResponse.json(
      {
        error: "Failed to create group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}