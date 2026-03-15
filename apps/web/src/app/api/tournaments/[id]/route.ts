import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        season: true,
        venue: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Failed to fetch tournament:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tournament",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const seasonId = String(body.seasonId ?? "").trim();
    const venueId = String(body.venueId ?? "").trim();
    const tournamentName = String(body.tournamentName ?? "").trim();
    const participantType = String(body.participantType ?? "").trim();
    const startDate = body.startDate ? String(body.startDate) : null;
    const endDate = body.endDate ? String(body.endDate) : null;
    const status = String(body.status ?? "").trim();
    const isPublished = Boolean(body.isPublished);
    const description = String(body.description ?? "").trim();

    if (!seasonId || !tournamentName || !participantType) {
      return NextResponse.json(
        {
          error: "Season, tournament name, and participant type are required.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        seasonId,
        venueId: venueId || null,
        tournamentName,
        participantType: participantType as
          | "Singles"
          | "Doubles"
          | "Triples"
          | "Teams",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: (status || "DRAFT") as
          | "DRAFT"
          | "REGISTRATION_OPEN"
          | "REGISTRATION_CLOSED"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED",
        isPublished,
        description: description || null,
      },
      include: {
        season: true,
        venue: true,
      },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Failed to update tournament:", error);

    return NextResponse.json(
      {
        error: "Failed to update tournament",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.tournament.findUnique({
      where: { id },
      include: {
        stages: true,
        entries: true,
        matches: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (
      existing.stages.length > 0 ||
      existing.entries.length > 0 ||
      existing.matches.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete tournament because it has related stages, entries, or matches.",
        },
        { status: 400 }
      );
    }

    await prisma.tournament.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tournament:", error);

    return NextResponse.json(
      {
        error: "Failed to delete tournament",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}