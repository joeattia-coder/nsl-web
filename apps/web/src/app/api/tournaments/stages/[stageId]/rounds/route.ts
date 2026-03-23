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
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { stageId } = await context.params;
    const permissionScopes = await getStageAdminPermissionScopes(stageId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "rounds.view", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const rounds = await prisma.stageRound.findMany({
      where: { tournamentStageId: stageId },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: {
            groups: true,
            matches: true,
          },
        },
      },
    });

    return NextResponse.json(rounds);
  } catch (error) {
    console.error("Failed to fetch stage rounds:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch stage rounds",
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

    const { stageId } = await context.params;
    const permissionScopes = await getStageAdminPermissionScopes(stageId);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "rounds.create", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();

    const roundName = String(body.roundName ?? "").trim();
    const roundType = String(body.roundType ?? "").trim();
    const snookerFormat = String(body.snookerFormat ?? "").trim();
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
      !snookerFormat ||
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

    if (
      snookerFormat !== "REDS_6" &&
      snookerFormat !== "REDS_10" &&
      snookerFormat !== "REDS_15"
    ) {
      return NextResponse.json(
        { error: "Invalid snooker format." },
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

    const stage = await prisma.tournamentStage.findUnique({
      where: { id: stageId },
      select: { id: true },
    });

    if (!stage) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const round = await tx.stageRound.create({
        data: {
          tournamentStageId: stageId,
          roundName,
          roundType: roundType as "GROUP" | "KNOCKOUT",
          sequence,
          matchesPerPairing,
          bestOfFrames,
          snookerFormat: snookerFormat as "REDS_6" | "REDS_10" | "REDS_15",
          groupCount: roundType === "GROUP" ? groupCount : null,
          playersPerGroup: roundType === "GROUP" ? playersPerGroup : null,
          advancePerGroup: roundType === "GROUP" ? advancePerGroup : null,
        },
      });

      if (roundType === "GROUP" && groupCount) {
        await tx.tournamentGroup.createMany({
          data: Array.from({ length: groupCount }, (_, index) => ({
            stageRoundId: round.id,
            groupName: getGroupName(index),
            sequence: index + 1,
          })),
        });
      }

      return round;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create stage round:", error);

    return NextResponse.json(
      {
        error: "Failed to create stage round",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}