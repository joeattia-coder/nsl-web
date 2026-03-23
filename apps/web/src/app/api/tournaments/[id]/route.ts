import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildSeasonAdminPermissionScopes,
  getTournamentAdminPermissionScopes,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const permissionScopes = await getTournamentAdminPermissionScopes(id);

    if (!permissionScopes) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (!hasScopedAdminPermission(currentUser, "tournaments.view", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

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
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const permissionScopes = await getTournamentAdminPermissionScopes(id);

    if (!permissionScopes) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (!hasScopedAdminPermission(currentUser, "tournaments.edit", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

    const existing = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, seasonId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (seasonId !== existing.seasonId) {
      const targetSeason = await prisma.season.findUnique({
        where: { id: seasonId },
        select: {
          id: true,
          leagueId: true,
        },
      });

      if (!targetSeason) {
        return NextResponse.json(
          { error: "Season not found" },
          { status: 404 }
        );
      }

      if (
        !hasScopedAdminPermission(
          currentUser,
          "tournaments.create",
          buildSeasonAdminPermissionScopes(targetSeason.id, targetSeason.leagueId)
        )
      ) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
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
        snookerFormat: (snookerFormat || null) as
          | "REDS_6"
          | "REDS_10"
          | "REDS_15"
          | null,
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
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const permissionScopes = await getTournamentAdminPermissionScopes(id);

    if (!permissionScopes) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    if (!hasScopedAdminPermission(currentUser, "tournaments.delete", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const [existing, roundsCount, groupsCount] = await Promise.all([
      prisma.tournament.findUnique({
        where: { id },
        select: {
          id: true,
          tournamentName: true,
          _count: {
            select: {
              stages: true,
              entries: true,
              matches: true,
            },
          },
        },
      }),
      prisma.stageRound.count({
        where: {
          tournamentStage: {
            tournamentId: id,
          },
        },
      }),
      prisma.tournamentGroup.count({
        where: {
          stageRound: {
            tournamentStage: {
              tournamentId: id,
            },
          },
        },
      }),
    ]);

    if (!existing) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    await prisma.tournament.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        tournamentName: existing.tournamentName,
        stages: existing._count.stages,
        rounds: roundsCount,
        groups: groupsCount,
        entries: existing._count.entries,
        matches: existing._count.matches,
      },
    });
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