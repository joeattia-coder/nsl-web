import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { roundId } = await context.params;

    const round = await prisma.stageRound.findUnique({
      where: { id: roundId },
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
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    return NextResponse.json(round);
  } catch (error) {
    console.error("Failed to fetch stage round:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch stage round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { roundId } = await context.params;
    const body = await request.json();

    const roundName = String(body.roundName ?? "").trim();
    const roundType = String(body.roundType ?? "").trim();
    const sequence = Number(body.sequence);
    const matchesPerPairing = Number(body.matchesPerPairing);
    const bestOfFrames = Number(body.bestOfFrames);

    const groupCountRaw = body.groupCount;
    const playersPerGroupRaw = body.playersPerGroup;
    const advancePerGroupRaw = body.advancePerGroup;

    const groupCount =
      groupCountRaw === null ||
      groupCountRaw === undefined ||
      String(groupCountRaw).trim() === ""
        ? null
        : Number(groupCountRaw);

    const playersPerGroup =
      playersPerGroupRaw === null ||
      playersPerGroupRaw === undefined ||
      String(playersPerGroupRaw).trim() === ""
        ? null
        : Number(playersPerGroupRaw);

    const advancePerGroup =
      advancePerGroupRaw === null ||
      advancePerGroupRaw === undefined ||
      String(advancePerGroupRaw).trim() === ""
        ? null
        : Number(advancePerGroupRaw);

    if (
      !roundName ||
      !roundType ||
      !Number.isInteger(sequence) ||
      sequence < 1 ||
      !Number.isInteger(matchesPerPairing) ||
      matchesPerPairing < 1 ||
      !Number.isInteger(bestOfFrames) ||
      bestOfFrames < 1 ||
      bestOfFrames % 2 === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Round name, round type, sequence, matches per pairing, and an odd best-of frame count are required.",
        },
        { status: 400 }
      );
    }

    if (roundType !== "GROUP" && roundType !== "KNOCKOUT") {
      return NextResponse.json(
        { error: "Invalid round type." },
        { status: 400 }
      );
    }

    if (roundType === "GROUP") {
      if (!Number.isInteger(groupCount) || (groupCount as number) < 1) {
        return NextResponse.json(
          {
            error:
              "Number of groups must be a whole number greater than or equal to 1.",
          },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(playersPerGroup) ||
        (playersPerGroup as number) < 1
      ) {
        return NextResponse.json(
          {
            error:
              "Players per group must be a whole number greater than or equal to 1.",
          },
          { status: 400 }
        );
      }

      if (
        advancePerGroup !== null &&
        (!Number.isInteger(advancePerGroup) || advancePerGroup < 1)
      ) {
        return NextResponse.json(
          {
            error:
              "Advance per group must be a whole number greater than or equal to 1.",
          },
          { status: 400 }
        );
      }

      if (
        advancePerGroup !== null &&
        playersPerGroup !== null &&
        advancePerGroup > playersPerGroup
      ) {
        return NextResponse.json(
          {
            error:
              "Advance per group cannot be greater than players per group.",
          },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.stageRound.findUnique({
      where: { id: roundId },
      include: {
        groups: {
          orderBy: { sequence: "asc" },
          include: {
            participants: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    const round = await prisma.$transaction(async (tx) => {
      const updatedRound = await tx.stageRound.update({
        where: { id: roundId },
        data: {
          roundName,
          roundType: roundType as "GROUP" | "KNOCKOUT",
          sequence,
          matchesPerPairing,
          bestOfFrames,
          groupCount: roundType === "GROUP" ? groupCount : null,
          playersPerGroup: roundType === "GROUP" ? playersPerGroup : null,
          advancePerGroup: roundType === "GROUP" ? advancePerGroup : null,
        },
      });

      if (roundType === "GROUP" && groupCount) {
        const existingGroups = existing.groups;
        const existingCount = existingGroups.length;

        if (groupCount > existingCount) {
          await tx.tournamentGroup.createMany({
            data: Array.from(
              { length: groupCount - existingCount },
              (_, index) => ({
                stageRoundId: roundId,
                groupName: getGroupName(existingCount + index),
                sequence: existingCount + index + 1,
              })
            ),
          });
        } else if (groupCount < existingCount) {
          const groupsToRemove = existingGroups.filter(
            (group) => group.sequence > groupCount
          );

          const blockedGroup = groupsToRemove.find(
            (group) => group.participants.length > 0
          );

          if (blockedGroup) {
            throw new Error(
              "Cannot reduce the number of groups because one or more groups being removed already have assigned entries."
            );
          }

          if (groupsToRemove.length > 0) {
            await tx.tournamentGroup.deleteMany({
              where: {
                id: {
                  in: groupsToRemove.map((group) => group.id),
                },
              },
            });
          }
        }
      }

      if (roundType === "KNOCKOUT" && existing.groups.length > 0) {
        const hasAssignedParticipants = existing.groups.some(
          (group) => group.participants.length > 0
        );

        if (hasAssignedParticipants) {
          throw new Error(
            "Cannot change this round to knockout because one or more groups already have assigned entries."
          );
        }

        await tx.tournamentGroup.deleteMany({
          where: { stageRoundId: roundId },
        });
      }

      return updatedRound;
    });

    return NextResponse.json(round);
  } catch (error) {
    console.error("Failed to update stage round:", error);

    return NextResponse.json(
      {
        error: "Failed to update stage round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { roundId } = await context.params;

    const existing = await prisma.stageRound.findUnique({
      where: { id: roundId },
      include: {
        groups: true,
        matches: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    if (existing.groups.length > 0 || existing.matches.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete round because it already has related groups or matches.",
        },
        { status: 400 }
      );
    }

    await prisma.stageRound.delete({
      where: { id: roundId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete stage round:", error);

    return NextResponse.json(
      {
        error: "Failed to delete stage round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}