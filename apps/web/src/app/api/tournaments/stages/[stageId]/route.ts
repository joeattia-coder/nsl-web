import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getStageAdminPermissionScopes,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ stageId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { stageId } = await context.params;
    const permissionScopes = await getStageAdminPermissionScopes(stageId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "stages.view", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const stage = await prisma.tournamentStage.findUnique({
      where: { id: stageId },
      include: {
        tournament: {
          select: {
            id: true,
            tournamentName: true,
          },
        },
      },
    });

    if (!stage) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    return NextResponse.json(stage);
  } catch (error) {
    console.error("Failed to fetch tournament stage:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tournament stage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { stageId } = await context.params;
    const permissionScopes = await getStageAdminPermissionScopes(stageId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "stages.edit", permissionScopes)) {
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

    const existing = await prisma.tournamentStage.findUnique({
      where: { id: stageId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    const stage = await prisma.tournamentStage.update({
      where: { id: stageId },
      data: {
        stageName,
        stageType: stageType as "GROUP" | "KNOCKOUT",
        sequence,
      },
    });

    return NextResponse.json(stage);
  } catch (error) {
    console.error("Failed to update tournament stage:", error);

    return NextResponse.json(
      {
        error: "Failed to update tournament stage",
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

    const { stageId } = await context.params;
    const permissionScopes = await getStageAdminPermissionScopes(stageId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "stages.delete", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const existing = await prisma.tournamentStage.findUnique({
      where: { id: stageId },
      include: {
        rounds: true,
        matches: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    if (existing.rounds.length > 0 || existing.matches.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete stage because it already has related rounds or matches.",
        },
        { status: 400 }
      );
    }

    await prisma.tournamentStage.delete({
      where: { id: stageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tournament stage:", error);

    return NextResponse.json(
      {
        error: "Failed to delete tournament stage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}