import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
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

    const { id: tournamentId } = await context.params;
    const permissionScopes = await getTournamentAdminPermissionScopes(tournamentId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "entries.view", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const entries = await prisma.tournamentEntry.findMany({
      where: { tournamentId },
      include: {
        members: {
          include: {
            player: true,
          },
        },
      },
      orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch tournament entries:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tournament entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id: tournamentId } = await context.params;
    const permissionScopes = await getTournamentAdminPermissionScopes(tournamentId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "entries.create", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();

    const mode = String(body.mode ?? "").trim();

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 }
      );
    }

    if (mode === "existing") {
      const playerId = String(body.playerId ?? "").trim();
      const entryName = String(body.entryName ?? "").trim() || null;
      const seedNumber =
        body.seedNumber === null ||
        body.seedNumber === undefined ||
        String(body.seedNumber).trim() === ""
          ? null
          : Number(body.seedNumber);

      if (!playerId) {
        return NextResponse.json(
          { error: "Player is required." },
          { status: 400 }
        );
      }

      if (
        seedNumber !== null &&
        (!Number.isInteger(seedNumber) || seedNumber < 1)
      ) {
        return NextResponse.json(
          {
            error:
              "Seed number must be a whole number greater than or equal to 1.",
          },
          { status: 400 }
        );
      }

      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (!player) {
        return NextResponse.json(
          { error: "Player not found." },
          { status: 404 }
        );
      }

      const existingRegistration = await prisma.tournamentEntryMember.findFirst({
        where: {
          playerId,
          tournamentEntry: {
            tournamentId,
          },
        },
        select: { id: true },
      });

      if (existingRegistration) {
        return NextResponse.json(
          { error: "This player is already registered in the tournament." },
          { status: 400 }
        );
      }

      const entry = await prisma.$transaction(async (tx) => {
        const createdEntry = await tx.tournamentEntry.create({
          data: {
            tournamentId,
            entryName,
            seedNumber,
          },
        });

        await tx.tournamentEntryMember.create({
          data: {
            tournamentEntryId: createdEntry.id,
            playerId,
          },
        });

        return createdEntry;
      });

      return NextResponse.json(entry, { status: 201 });
    }

    if (mode === "new") {
      const player = body.player ?? {};

      const firstName = String(player.firstName ?? "").trim();
      const middleInitial = String(player.middleInitial ?? "").trim();
      const lastName = String(player.lastName ?? "").trim();
      const emailAddress = String(player.emailAddress ?? "").trim();
      const phoneNumber = String(player.phoneNumber ?? "").trim();
      const country = String(player.country ?? "").trim();

      const entryName = String(body.entryName ?? "").trim() || null;
      const seedNumber =
        body.seedNumber === null ||
        body.seedNumber === undefined ||
        String(body.seedNumber).trim() === ""
          ? null
          : Number(body.seedNumber);

      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: "First name and last name are required." },
          { status: 400 }
        );
      }

      if (
        seedNumber !== null &&
        (!Number.isInteger(seedNumber) || seedNumber < 1)
      ) {
        return NextResponse.json(
          {
            error:
              "Seed number must be a whole number greater than or equal to 1.",
          },
          { status: 400 }
        );
      }

      const entry = await prisma.$transaction(async (tx) => {
        const createdPlayer = await tx.player.create({
          data: {
            firstName,
            middleInitial: middleInitial
              ? middleInitial.slice(0, 1).toUpperCase()
              : null,
            lastName,
            emailAddress: emailAddress || null,
            phoneNumber: phoneNumber || null,
            country: country || null,
          },
        });

        const createdEntry = await tx.tournamentEntry.create({
          data: {
            tournamentId,
            entryName,
            seedNumber,
          },
        });

        await tx.tournamentEntryMember.create({
          data: {
            tournamentEntryId: createdEntry.id,
            playerId: createdPlayer.id,
          },
        });

        return createdEntry;
      });

      return NextResponse.json(entry, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid entry mode." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Failed to create tournament entry:", error);

    return NextResponse.json(
      {
        error: "Failed to create tournament entry",
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

    const { id: tournamentId } = await context.params;
    const permissionScopes = await getTournamentAdminPermissionScopes(tournamentId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "entries.delete", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        tournamentName: true,
        _count: {
          select: {
            matches: true,
            entries: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 }
      );
    }

    if (tournament._count.matches > 0) {
      return NextResponse.json(
        {
          error:
            "This tournament still has generated matches. Delete the tournament matches first, then delete the entries.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.tournamentEntry.deleteMany({
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
    console.error("Failed to delete tournament entries:", error);

    return NextResponse.json(
      {
        error: "Failed to delete tournament entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}