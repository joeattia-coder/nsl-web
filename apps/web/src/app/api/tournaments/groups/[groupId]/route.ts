import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { groupId } = await context.params;

    const group = await prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        stageRound: {
          include: {
            tournamentStage: {
              include: {
                tournament: {
                  select: {
                    id: true,
                    tournamentName: true,
                  },
                },
              },
            },
          },
        },
        participants: {
          include: {
            tournamentEntry: {
              include: {
                members: {
                  include: {
                    player: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to fetch group:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { groupId } = await context.params;
    const body = await request.json();

    const entryIdsRaw = Array.isArray(body.entryIds) ? body.entryIds : [];

    const entryIds: string[] = (entryIdsRaw as unknown[])
  .map((value: unknown): string => String(value ?? "").trim())
  .filter((value: string): boolean => value.length > 0);

    const uniqueEntryIds: string[] = Array.from(new Set(entryIds));

    if (uniqueEntryIds.length !== entryIds.length) {
      return NextResponse.json(
        { error: "The same entry cannot be assigned more than once in a group." },
        { status: 400 }
      );
    }

    const group = await prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        stageRound: {
          include: {
            tournamentStage: {
              select: {
                tournamentId: true,
              },
            },
          },
        },
        participants: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const playersPerGroup = group.stageRound.playersPerGroup ?? 0;

    if (playersPerGroup > 0 && uniqueEntryIds.length > playersPerGroup) {
      return NextResponse.json(
        {
          error: "Too many entries assigned for this group.",
        },
        { status: 400 }
      );
    }

    if (uniqueEntryIds.length > 0) {
      const validEntries = await prisma.tournamentEntry.findMany({
        where: {
          id: { in: uniqueEntryIds },
          tournamentId: group.stageRound.tournamentStage.tournamentId,
        },
        select: { id: true },
      });

      if (validEntries.length !== uniqueEntryIds.length) {
        return NextResponse.json(
          {
            error: "One or more selected entries do not belong to this tournament.",
          },
          { status: 400 }
        );
      }

      const conflictingAssignments = await prisma.groupParticipant.findMany({
        where: {
          tournamentEntryId: { in: uniqueEntryIds },
          tournamentGroup: {
            stageRoundId: group.stageRoundId,
          },
          NOT: {
            tournamentGroupId: groupId,
          },
        },
        select: {
          tournamentEntryId: true,
        },
      });

      if (conflictingAssignments.length > 0) {
        return NextResponse.json(
          {
            error:
              "One or more selected entries are already assigned to another group in this round.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.groupParticipant.deleteMany({
        where: {
          tournamentGroupId: groupId,
        },
      });

      if (uniqueEntryIds.length > 0) {
        await tx.groupParticipant.createMany({
          data: uniqueEntryIds.map((tournamentEntryId) => ({
            tournamentGroupId: groupId,
            tournamentEntryId,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update group assignments:", error);

    return NextResponse.json(
      {
        error: "Failed to update group assignments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { groupId } = await context.params;

    const group = await prisma.tournamentGroup.findUnique({
      where: { id: groupId },
      include: {
        participants: true,
        matches: true,
        stageRound: {
          select: {
            id: true,
            groupCount: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    if (group.participants.length > 0 || group.matches.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete this group because it already has assigned entries or matches.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.tournamentGroup.delete({
        where: { id: groupId },
      });

      const remainingCount = await tx.tournamentGroup.count({
        where: {
          stageRoundId: group.stageRound.id,
        },
      });

      await tx.stageRound.update({
        where: {
          id: group.stageRound.id,
        },
        data: {
          groupCount: remainingCount,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete group:", error);

    return NextResponse.json(
      {
        error: "Failed to delete group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}