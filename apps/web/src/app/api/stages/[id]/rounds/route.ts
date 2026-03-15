import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ROUND_TYPES = ["GROUP", "KNOCKOUT"];

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentStageId } = await context.params;

    const stage = await prisma.tournamentStage.findUnique({
      where: { id: tournamentStageId },
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Stage not found" },
        { status: 404 }
      );
    }

    const rounds = await prisma.stageRound.findMany({
      where: { tournamentStageId },
      orderBy: { sequence: "asc" },
      include: {
        groups: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    return NextResponse.json(rounds);
  } catch (error) {
    console.error("GET /api/stages/[id]/rounds error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch rounds",
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
    const { id: tournamentStageId } = await context.params;
    const body = await request.json();

    const { roundName, roundType, sequence, matchesPerPairing } = body;

    if (!roundName) {
      return NextResponse.json(
        { error: "roundName is required" },
        { status: 400 }
      );
    }

    if (!roundType || !VALID_ROUND_TYPES.includes(roundType)) {
      return NextResponse.json(
        { error: "roundType must be GROUP or KNOCKOUT" },
        { status: 400 }
      );
    }

    if (sequence === undefined || sequence === null) {
      return NextResponse.json(
        { error: "sequence is required" },
        { status: 400 }
      );
    }

    const stage = await prisma.tournamentStage.findUnique({
      where: { id: tournamentStageId },
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Stage not found" },
        { status: 404 }
      );
    }

    const round = await prisma.stageRound.create({
      data: {
        tournamentStageId,
        roundName,
        roundType,
        sequence,
        matchesPerPairing:
          roundType === "GROUP" ? (matchesPerPairing ?? 1) : 1,
      },
    });

    return NextResponse.json(round, { status: 201 });
  } catch (error) {
    console.error("POST /api/stages/[id]/rounds error:", error);

    return NextResponse.json(
      {
        error: "Failed to create round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}