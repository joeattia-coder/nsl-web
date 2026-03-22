import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ entryId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params;

    const entry = await prisma.tournamentEntry.findUnique({
      where: { id: entryId },
      include: {
        homeMatches: true,
        awayMatches: true,
        winnerMatches: true,
        matchFrames: true,
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Tournament entry not found." },
        { status: 404 }
      );
    }

    const hasMatchAssignments =
      entry.homeMatches.length > 0 ||
      entry.awayMatches.length > 0 ||
      entry.winnerMatches.length > 0 ||
      entry.matchFrames.length > 0;

    if (hasMatchAssignments) {
      return NextResponse.json(
        {
          error:
            "This entry is still used by generated matches. Delete the tournament matches first, then try again.",
        },
        { status: 400 }
      );
    }

    await prisma.tournamentEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tournament entry:", error);

    return NextResponse.json(
      {
        error: "Failed to delete tournament entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}