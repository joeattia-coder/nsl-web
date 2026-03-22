import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ roundId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { roundId } = await context.params;

    const round = await prisma.stageRound.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        roundName: true,
        tournamentStage: {
          select: {
            tournament: {
              select: {
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

    const result = await prisma.match.deleteMany({
      where: {
        stageRoundId: roundId,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      roundName: round.roundName,
      tournamentName: round.tournamentStage.tournament.tournamentName,
    });
  } catch (error) {
    console.error("Failed to delete round matches:", error);

    return NextResponse.json(
      {
        error: "Failed to delete round matches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
