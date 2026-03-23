import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getRoundAdminPermissionScopes,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{ roundId: string }>;
};

function getGroupName(index: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (index < alphabet.length) {
    return `Group ${alphabet[index]}`;
  }

  let n = index;
  let suffix = "";

  do {
    suffix = String.fromCharCode(65 + (n % 26)) + suffix;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  return `Group ${suffix}`;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { roundId } = await context.params;
    const permissionScopes = await getRoundAdminPermissionScopes(roundId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "groups.create", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const round = await prisma.stageRound.findUnique({
      where: { id: roundId },
      include: {
        groups: {
          orderBy: { sequence: "asc" },
          select: {
            id: true,
            sequence: true,
            groupName: true,
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    if (round.roundType !== "GROUP") {
      return NextResponse.json(
        { error: "Groups can only be added to group rounds." },
        { status: 400 }
      );
    }

    const nextSequence =
      round.groups.length > 0
        ? Math.max(...round.groups.map((group) => group.sequence)) + 1
        : 1;

    const newGroupName = getGroupName(nextSequence - 1);

    const createdGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.tournamentGroup.create({
        data: {
          stageRoundId: roundId,
          groupName: newGroupName,
          sequence: nextSequence,
        },
      });

      await tx.stageRound.update({
        where: { id: roundId },
        data: {
          groupCount: (round.groupCount ?? round.groups.length) + 1,
        },
      });

      return group;
    });

    return NextResponse.json(createdGroup, { status: 201 });
  } catch (error) {
    console.error("Failed to create group:", error);

    return NextResponse.json(
      {
        error: "Failed to create group",
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

    const { roundId } = await context.params;
    const permissionScopes = await getRoundAdminPermissionScopes(roundId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "groups.delete", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const round = await prisma.stageRound.findUnique({
      where: { id: roundId },
      include: {
        groups: {
          select: {
            id: true,
          },
        },
        matches: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    if (round.roundType !== "GROUP") {
      return NextResponse.json(
        { error: "Groups can only be deleted from group rounds." },
        { status: 400 }
      );
    }

    if (round.matches.length > 0) {
      return NextResponse.json(
        {
          error:
            "This round still has generated matches. Delete the round matches first, then delete the groups.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.tournamentGroup.deleteMany({
        where: {
          stageRoundId: roundId,
        },
      });

      await tx.stageRound.update({
        where: { id: roundId },
        data: {
          groupCount: 0,
        },
      });

      return deleted;
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      roundName: round.roundName,
    });
  } catch (error) {
    console.error("Failed to delete groups:", error);

    return NextResponse.json(
      {
        error: "Failed to delete groups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}