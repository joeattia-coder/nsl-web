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

    if (!hasScopedAdminPermission(currentUser, "matches.delete", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

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
