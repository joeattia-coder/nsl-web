import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        season: true,
        venue: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("Failed to fetch tournaments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tournaments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const seasonId = String(body.seasonId ?? "").trim();
    const venueId = String(body.venueId ?? "").trim();
    const tournamentName = String(body.tournamentName ?? "").trim();
    const participantType = String(body.participantType ?? "").trim();
    const registrationDeadline = body.registrationDeadline
      ? String(body.registrationDeadline)
      : null;
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

    const tournament = await prisma.tournament.create({
      data: {
        seasonId,
        venueId: venueId || null,
        tournamentName,
        participantType: participantType as
          | "Singles"
          | "Doubles"
          | "Triples"
          | "Teams",
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline)
          : null,
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

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("Failed to create tournament:", error);

    return NextResponse.json(
      {
        error: "Failed to create tournament",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}