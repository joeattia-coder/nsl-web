import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchFrameId } = await context.params;

    const frame = await prisma.matchFrame.findUnique({
      where: { id: matchFrameId },
    });

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const breaks = await prisma.playerBreak.findMany({
      where: { matchFrameId },
      include: {
        player: true,
      },
      orderBy: [{ breakValue: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(breaks);
  } catch (error) {
    console.error("GET /api/frames/[id]/breaks error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch frame breaks",
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
    const { id: matchFrameId } = await context.params;
    const body = await request.json();

    const { playerId, breakValue } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: "playerId is required" },
        { status: 400 }
      );
    }

    if (breakValue === undefined || breakValue === null) {
      return NextResponse.json(
        { error: "breakValue is required" },
        { status: 400 }
      );
    }

    if (typeof breakValue !== "number" || breakValue < 0) {
      return NextResponse.json(
        { error: "breakValue must be a non-negative number" },
        { status: 400 }
      );
    }

    const frame = await prisma.matchFrame.findUnique({
      where: { id: matchFrameId },
      include: {
        match: {
          include: {
            homeEntry: {
              include: {
                members: true,
              },
            },
            awayEntry: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!frame) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const allowedPlayerIds = new Set([
      ...frame.match.homeEntry.members.map((member) => member.playerId),
      ...frame.match.awayEntry.members.map((member) => member.playerId),
    ]);

    if (!allowedPlayerIds.has(playerId)) {
      return NextResponse.json(
        {
          error:
            "This player is not part of either entry in the match for this frame",
        },
        { status: 400 }
      );
    }

    const playerBreak = await prisma.playerBreak.create({
      data: {
        matchFrameId,
        playerId,
        breakValue,
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(playerBreak, { status: 201 });
  } catch (error) {
    console.error("POST /api/frames/[id]/breaks error:", error);

    return NextResponse.json(
      {
        error: "Failed to create player break",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}