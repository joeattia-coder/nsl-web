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

type Pairing = {
  homeEntryId: string;
  awayEntryId: string;
};

function buildPairings(entryIds: string[], matchesPerPairing: number): Pairing[] {
  const pairings: Pairing[] = [];

  for (let i = 0; i < entryIds.length; i += 1) {
    for (let j = i + 1; j < entryIds.length; j += 1) {
      const a = entryIds[i];
      const b = entryIds[j];

      for (let leg = 0; leg < matchesPerPairing; leg += 1) {
        const isEvenLeg = leg % 2 === 0;

        pairings.push({
          homeEntryId: isEvenLeg ? a : b,
          awayEntryId: isEvenLeg ? b : a,
        });
      }
    }
  }

  return pairings;
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

    if (!hasScopedAdminPermission(currentUser, "matches.create", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const round = await prisma.stageRound.findUnique({
      where: { id: roundId },
      include: {
        tournamentStage: {
          select: {
            id: true,
            tournamentId: true,
          },
        },
        groups: {
          orderBy: { sequence: "asc" },
          include: {
            participants: {
              include: {
                tournamentEntry: {
                  select: {
                    id: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        matches: {
          select: { id: true },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found." }, { status: 404 });
    }

    if (round.roundType !== "GROUP") {
      return NextResponse.json(
        { error: "Matches can only be generated automatically for group rounds." },
        { status: 400 }
      );
    }

    if (round.matches.length > 0) {
      return NextResponse.json(
        { error: "Matches already exist for this round." },
        { status: 400 }
      );
    }

    if (round.groups.length === 0) {
      return NextResponse.json(
        { error: "This round does not have any groups yet." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(round.matchesPerPairing) || round.matchesPerPairing < 1) {
      return NextResponse.json(
        { error: "Matches per pairing must be at least 1." },
        { status: 400 }
      );
    }

    const matchRows = round.groups.flatMap((group) => {
      const entryIds = group.participants.map(
        (participant) => participant.tournamentEntry.id
      );

      if (entryIds.length < 2) {
        return [];
      }

      const pairings = buildPairings(entryIds, round.matchesPerPairing);

      return pairings.map((pairing) => ({
        tournamentId: round.tournamentStage.tournamentId,
        tournamentStageId: round.tournamentStage.id,
        stageRoundId: round.id,
        tournamentGroupId: group.id,
        bestOfFrames: round.bestOfFrames ?? 5,
        snookerFormat: round.snookerFormat ?? "REDS_15",
        homeEntryId: pairing.homeEntryId,
        awayEntryId: pairing.awayEntryId,
      }));
    });

    if (matchRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No matches could be generated. Each group needs at least two assigned entries.",
        },
        { status: 400 }
      );
    }

    await prisma.match.createMany({
      data: matchRows,
    });

    return NextResponse.json(
      {
        success: true,
        createdCount: matchRows.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to generate group matches:", error);

    return NextResponse.json(
      {
        error: "Failed to generate group matches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}