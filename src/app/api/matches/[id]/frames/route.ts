import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await context.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const frames = await prisma.matchFrame.findMany({
      where: { matchId },
      include: {
        winnerEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        breaks: {
          include: {
            player: true,
          },
          orderBy: [{ breakValue: "desc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { frameNumber: "asc" },
    });

    return NextResponse.json(frames);
  } catch (error) {
    console.error("GET /api/matches/[id]/frames error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch match frames",
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
    const { id: matchId } = await context.params;
    const body = await request.json();

    const { frameNumber, winnerEntryId, homePoints, awayPoints } = body;

    if (frameNumber === undefined || frameNumber === null) {
      return NextResponse.json(
        { error: "frameNumber is required" },
        { status: 400 }
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeEntryId: true,
        awayEntryId: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const existingFrame = await prisma.matchFrame.findUnique({
      where: {
        matchId_frameNumber: {
          matchId,
          frameNumber,
        },
      },
    });

    if (existingFrame) {
      return NextResponse.json(
        { error: "A frame with this frameNumber already exists for the match" },
        { status: 400 }
      );
    }

    if (
      winnerEntryId &&
      winnerEntryId !== match.homeEntryId &&
      winnerEntryId !== match.awayEntryId
    ) {
      return NextResponse.json(
        {
          error: "winnerEntryId must match either the homeEntryId or awayEntryId for this match",
        },
        { status: 400 }
      );
    }

    const frame = await prisma.matchFrame.create({
      data: {
        matchId,
        frameNumber,
        winnerEntryId: winnerEntryId ?? null,
        homePoints: homePoints ?? null,
        awayPoints: awayPoints ?? null,
      },
      include: {
        winnerEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        breaks: {
          include: {
            player: true,
          },
          orderBy: [{ breakValue: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json(frame, { status: 201 });
  } catch (error) {
    console.error("POST /api/matches/[id]/frames error:", error);

    return NextResponse.json(
      {
        error: "Failed to create match frame",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}