import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: tournamentId } = await context.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        tournamentName: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 }
      );
    }

    const result = await prisma.match.deleteMany({
      where: {
        tournamentId,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      tournamentName: tournament.tournamentName,
    });
  } catch (error) {
    console.error("Failed to delete tournament matches:", error);

    return NextResponse.json(
      {
        error: "Failed to delete tournament matches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
