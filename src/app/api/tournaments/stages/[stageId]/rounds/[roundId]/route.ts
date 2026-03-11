import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ roundId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { roundId } = await context.params;

    const round = await prisma.stageRound.findUnique({
      where: { id: roundId },
      include: {
        tournamentStage: {
          include: {
            tournament: {
              select: {
                id: true,
                tournamentName: true,
              },
            },
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    return NextResponse.json(round);
  } catch (error) {
    console.error("Failed to fetch stage round:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch stage round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { roundId } = await context.params;
    const body = await request.json();

    const roundName = String(body.roundName ?? "").trim();
    const roundType = String(body.roundType ?? "").trim();
    const sequence = Number(body.sequence);
    const matchesPerPairing = Number(body.matchesPerPairing);

    if (
      !roundName ||
      !roundType ||
      !Number.isInteger(sequence) ||
      sequence < 1 ||
      !Number.isInteger(matchesPerPairing) ||
      matchesPerPairing < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Round name, round type, sequence, and matches per pairing are required.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.stageRound.findUnique({
      where: { id: roundId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    const round = await prisma.stageRound.update({
      where: { id: roundId },
      data: {
        roundName,
        roundType: roundType as "GROUP" | "KNOCKOUT",
        sequence,
        matchesPerPairing,
      },
    });

    return NextResponse.json(round);
  } catch (error) {
    console.error("Failed to update stage round:", error);

    return NextResponse.json(
      {
        error: "Failed to update stage round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { roundId } = await context.params;

    const existing = await prisma.stageRound.findUnique({
      where: { id: roundId },
      include: {
        groups: true,
        matches: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    if (existing.groups.length > 0 || existing.matches.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete round because it already has related groups or matches.",
        },
        { status: 400 }
      );
    }

    await prisma.stageRound.delete({
      where: { id: roundId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete stage round:", error);

    return NextResponse.json(
      {
        error: "Failed to delete stage round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}