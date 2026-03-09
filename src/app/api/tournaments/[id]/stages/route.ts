import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STAGE_TYPES = ["GROUP", "KNOCKOUT"];

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

    const stages = await prisma.tournamentStage.findMany({
      where: { tournamentId },
      orderBy: { sequence: "asc" },
      include: {
        rounds: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error("GET /api/tournaments/[id]/stages error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch stages",
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

    const { stageName, stageType, sequence } = body;

    if (!stageName) {
      return NextResponse.json(
        { error: "stageName is required" },
        { status: 400 }
      );
    }

    if (!stageType || !VALID_STAGE_TYPES.includes(stageType)) {
      return NextResponse.json(
        { error: "stageType must be GROUP or KNOCKOUT" },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const stage = await prisma.tournamentStage.create({
      data: {
        tournamentId,
        stageName,
        stageType,
        sequence,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error("POST /api/tournaments/[id]/stages error:", error);

    return NextResponse.json(
      {
        error: "Failed to create stage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}