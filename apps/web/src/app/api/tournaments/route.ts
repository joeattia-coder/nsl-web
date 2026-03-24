import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateTimeInTimeZone } from "@/lib/timezone";
import {
  buildSeasonAdminPermissionScopes,
  buildTournamentAdminPermissionScopes,
  hasAnyAdminPermission,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";

export async function GET() {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAnyAdminPermission(currentUser, "tournaments.view")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const tournaments = await prisma.tournament.findMany({
      include: {
        season: {
          select: {
            id: true,
            seasonName: true,
            leagueId: true,
          },
        },
        venue: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(
      tournaments.filter((tournament) =>
        hasScopedAdminPermission(
          currentUser,
          "tournaments.view",
          buildTournamentAdminPermissionScopes(
            tournament.id,
            tournament.seasonId,
            tournament.season.leagueId
          )
        )
      )
    );
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
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();

    const seasonId = String(body.seasonId ?? "").trim();
    const venueId = String(body.venueId ?? "").trim();
    const tournamentName = String(body.tournamentName ?? "").trim();
    const participantType = String(body.participantType ?? "").trim();
    const snookerFormat = body.snookerFormat ? String(body.snookerFormat).trim() : null;
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

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      select: {
        id: true,
        leagueId: true,
      },
    });

    if (!season) {
      return NextResponse.json(
        { error: "Season not found." },
        { status: 404 }
      );
    }

    if (
      !hasScopedAdminPermission(
        currentUser,
        "tournaments.create",
        buildSeasonAdminPermissionScopes(season.id, season.leagueId)
      )
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
        snookerFormat: (snookerFormat || null) as
          | "REDS_6"
          | "REDS_10"
          | "REDS_15"
          | null,
        registrationDeadline: parseDateTimeInTimeZone(registrationDeadline),
        startDate: parseDateTimeInTimeZone(startDate),
        endDate: parseDateTimeInTimeZone(endDate),
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