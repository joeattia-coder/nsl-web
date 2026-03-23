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

    if (!hasScopedAdminPermission(currentUser, "stages.view", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const stages = await prisma.tournamentStage.findMany({
      where: { tournamentId },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: {
            rounds: true,
            matches: true,
          },
        },
      },
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error("Failed to fetch tournament stages:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tournament stages",
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

    if (!hasScopedAdminPermission(currentUser, "stages.create", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();

    const stageName = String(body.stageName ?? "").trim();
    const stageType = String(body.stageType ?? "").trim();
    const sequence = Number(body.sequence);

    if (!stageName || !stageType || !Number.isInteger(sequence) || sequence < 1) {
      return NextResponse.json(
        {
          error: "Stage name, stage type, and a valid sequence are required.",
        },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 }
      );
    }

    const stage = await prisma.tournamentStage.create({
      data: {
        tournamentId,
        stageName,
        stageType: stageType as "GROUP" | "KNOCKOUT",
        sequence,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error("Failed to create tournament stage:", error);

    return NextResponse.json(
      {
        error: "Failed to create tournament stage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}