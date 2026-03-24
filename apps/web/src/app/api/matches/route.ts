import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateAndPersistPlayerElo } from "@/lib/player-elo";
import { parseDateTimeInTimeZone, parseStoredMatchDateTime } from "@/lib/timezone";

const VALID_MATCH_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "POSTPONED",
  "CANCELLED",
  "FORFEIT",
  "ABANDONED",
];

const VALID_SCHEDULE_STATUSES = ["TBC", "CONFIRMED"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const tournamentId = searchParams.get("tournamentId");
    const tournamentStageId = searchParams.get("tournamentStageId");
    const stageRoundId = searchParams.get("stageRoundId");
    const tournamentGroupId = searchParams.get("tournamentGroupId");

    const matches = await prisma.match.findMany({
      where: {
        ...(tournamentId ? { tournamentId } : {}),
        ...(tournamentStageId ? { tournamentStageId } : {}),
        ...(stageRoundId ? { stageRoundId } : {}),
        ...(tournamentGroupId ? { tournamentGroupId } : {}),
      },
      include: {
        tournament: true,
        tournamentStage: true,
        stageRound: true,
        tournamentGroup: true,
        venue: true,
        homeEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        awayEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        winnerEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        approvedByUser: true,
        enteredByUser: true,
        updatedByUser: true,
        frames: {
          orderBy: {
            frameNumber: "asc",
          },
        },
      },
      orderBy: [
        { matchDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET /api/matches error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch matches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      tournamentId,
      tournamentStageId,
      stageRoundId,
      tournamentGroupId,
      venueId,
      matchDate,
      matchTime,
      scheduleStatus,
      matchStatus,
      homeEntryId,
      awayEntryId,
      winnerEntryId,
      homeScore,
      awayScore,
      internalNote,
      publicNote,
      resultSubmittedAt,
      approvedAt,
      approvedByUserId,
      enteredByUserId,
      updatedByUserId,
    } = body;
    const bestOfFrames =
      body.bestOfFrames === null || body.bestOfFrames === undefined
        ? null
        : Number(body.bestOfFrames);
    const snookerFormat =
      body.snookerFormat === null || body.snookerFormat === undefined
        ? null
        : String(body.snookerFormat).trim();

    if (!tournamentId) {
      return NextResponse.json(
        { error: "tournamentId is required" },
        { status: 400 }
      );
    }

    if (!tournamentStageId) {
      return NextResponse.json(
        { error: "tournamentStageId is required" },
        { status: 400 }
      );
    }

    if (!stageRoundId) {
      return NextResponse.json(
        { error: "stageRoundId is required" },
        { status: 400 }
      );
    }

    if (!homeEntryId) {
      return NextResponse.json(
        { error: "homeEntryId is required" },
        { status: 400 }
      );
    }

    if (!awayEntryId) {
      return NextResponse.json(
        { error: "awayEntryId is required" },
        { status: 400 }
      );
    }

    if (homeEntryId === awayEntryId) {
      return NextResponse.json(
        { error: "homeEntryId and awayEntryId must be different" },
        { status: 400 }
      );
    }

    if (
      scheduleStatus &&
      !VALID_SCHEDULE_STATUSES.includes(scheduleStatus)
    ) {
      return NextResponse.json(
        { error: "scheduleStatus must be TBC or CONFIRMED" },
        { status: 400 }
      );
    }

    if (matchStatus && !VALID_MATCH_STATUSES.includes(matchStatus)) {
      return NextResponse.json(
        {
          error:
            "matchStatus must be one of SCHEDULED, IN_PROGRESS, COMPLETED, POSTPONED, CANCELLED, FORFEIT, ABANDONED",
        },
        { status: 400 }
      );
    }

    if (
      bestOfFrames !== null &&
      (!Number.isInteger(bestOfFrames) || bestOfFrames < 1 || bestOfFrames % 2 === 0)
    ) {
      return NextResponse.json(
        { error: "bestOfFrames must be an odd whole number greater than or equal to 1" },
        { status: 400 }
      );
    }

    if (
      snookerFormat !== null &&
      snookerFormat !== "REDS_6" &&
      snookerFormat !== "REDS_10" &&
      snookerFormat !== "REDS_15"
    ) {
      return NextResponse.json(
        { error: "snookerFormat must be REDS_6, REDS_10, or REDS_15" },
        { status: 400 }
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const stage = await prisma.tournamentStage.findUnique({
      where: { id: tournamentStageId },
    });

    if (!stage) {
      return NextResponse.json(
        { error: "Tournament stage not found" },
        { status: 404 }
      );
    }

    if (stage.tournamentId !== tournamentId) {
      return NextResponse.json(
        { error: "Tournament stage does not belong to the supplied tournament" },
        { status: 400 }
      );
    }

    const round = await prisma.stageRound.findUnique({
      where: { id: stageRoundId },
    });

    if (!round) {
      return NextResponse.json(
        { error: "Stage round not found" },
        { status: 404 }
      );
    }

    if (round.tournamentStageId !== tournamentStageId) {
      return NextResponse.json(
        { error: "Stage round does not belong to the supplied stage" },
        { status: 400 }
      );
    }

    if (tournamentGroupId) {
      const group = await prisma.tournamentGroup.findUnique({
        where: { id: tournamentGroupId },
      });

      if (!group) {
        return NextResponse.json(
          { error: "Tournament group not found" },
          { status: 404 }
        );
      }

      if (group.stageRoundId !== stageRoundId) {
        return NextResponse.json(
          { error: "Tournament group does not belong to the supplied round" },
          { status: 400 }
        );
      }
    }

    if (venueId) {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
      });

      if (!venue) {
        return NextResponse.json(
          { error: "Venue not found" },
          { status: 404 }
        );
      }
    }

    const entries = await prisma.tournamentEntry.findMany({
      where: {
        id: {
          in: winnerEntryId
            ? [homeEntryId, awayEntryId, winnerEntryId]
            : [homeEntryId, awayEntryId],
        },
      },
    });

    const entryIds = new Set(entries.map((entry) => entry.id));

    if (!entryIds.has(homeEntryId)) {
      return NextResponse.json(
        { error: "homeEntryId was not found" },
        { status: 404 }
      );
    }

    if (!entryIds.has(awayEntryId)) {
      return NextResponse.json(
        { error: "awayEntryId was not found" },
        { status: 404 }
      );
    }

    if (winnerEntryId && !entryIds.has(winnerEntryId)) {
      return NextResponse.json(
        { error: "winnerEntryId was not found" },
        { status: 404 }
      );
    }

    const homeEntry = entries.find((entry) => entry.id === homeEntryId);
    const awayEntry = entries.find((entry) => entry.id === awayEntryId);
    const winnerEntry = winnerEntryId
      ? entries.find((entry) => entry.id === winnerEntryId)
      : null;

    if (homeEntry?.tournamentId !== tournamentId) {
      return NextResponse.json(
        { error: "homeEntryId does not belong to the supplied tournament" },
        { status: 400 }
      );
    }

    if (awayEntry?.tournamentId !== tournamentId) {
      return NextResponse.json(
        { error: "awayEntryId does not belong to the supplied tournament" },
        { status: 400 }
      );
    }

    if (winnerEntry && winnerEntry.tournamentId !== tournamentId) {
      return NextResponse.json(
        { error: "winnerEntryId does not belong to the supplied tournament" },
        { status: 400 }
      );
    }

    if (
      winnerEntryId &&
      winnerEntryId !== homeEntryId &&
      winnerEntryId !== awayEntryId
    ) {
      return NextResponse.json(
        { error: "winnerEntryId must match either homeEntryId or awayEntryId" },
        { status: 400 }
      );
    }

    if (approvedByUserId) {
      const approvedByUser = await prisma.user.findUnique({
        where: { id: approvedByUserId },
      });

      if (!approvedByUser) {
        return NextResponse.json(
          { error: "approvedByUserId was not found" },
          { status: 404 }
        );
      }
    }

    if (enteredByUserId) {
      const enteredByUser = await prisma.user.findUnique({
        where: { id: enteredByUserId },
      });

      if (!enteredByUser) {
        return NextResponse.json(
          { error: "enteredByUserId was not found" },
          { status: 404 }
        );
      }
    }

    if (updatedByUserId) {
      const updatedByUser = await prisma.user.findUnique({
        where: { id: updatedByUserId },
      });

      if (!updatedByUser) {
        return NextResponse.json(
          { error: "updatedByUserId was not found" },
          { status: 404 }
        );
      }
    }

    const createdMatchId = await prisma.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          tournamentId,
          tournamentStageId,
          stageRoundId,
          tournamentGroupId: tournamentGroupId ?? null,
          venueId: venueId ?? null,
          matchDate: parseStoredMatchDateTime(matchDate, matchTime),
          matchTime: matchTime ?? null,
          scheduleStatus: scheduleStatus ?? "TBC",
          matchStatus: matchStatus ?? "SCHEDULED",
          homeEntryId,
          awayEntryId,
          winnerEntryId: winnerEntryId ?? null,
          homeScore: homeScore ?? null,
          awayScore: awayScore ?? null,
          internalNote: internalNote ?? null,
          publicNote: publicNote ?? null,
          snookerFormat: (snookerFormat ?? round.snookerFormat ?? tournament.snookerFormat ?? "REDS_15") as
            | "REDS_6"
            | "REDS_10"
            | "REDS_15",
          resultSubmittedAt: parseDateTimeInTimeZone(resultSubmittedAt),
          approvedAt: parseDateTimeInTimeZone(approvedAt),
          approvedByUserId: approvedByUserId ?? null,
          enteredByUserId: enteredByUserId ?? null,
          updatedByUserId: updatedByUserId ?? null,
        },
      });

      return created.id;
    });

    await recalculateAndPersistPlayerElo(prisma);

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: createdMatchId },
      include: {
        tournament: true,
        tournamentStage: true,
        stageRound: true,
        tournamentGroup: true,
        venue: true,
        homeEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        awayEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        winnerEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        approvedByUser: true,
        enteredByUser: true,
        updatedByUser: true,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("POST /api/matches error:", error);

    return NextResponse.json(
      {
        error: "Failed to create match",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}