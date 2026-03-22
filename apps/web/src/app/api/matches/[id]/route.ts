import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateAndPersistPlayerElo } from "@/lib/player-elo";

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

function isNonNegativeWholeNumber(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const match = await prisma.match.findUnique({
      where: { id },
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
              orderBy: { createdAt: "asc" },
            },
          },
        },
        awayEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        winnerEntry: {
          include: {
            members: {
              include: {
                player: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        approvedByUser: true,
        enteredByUser: true,
        updatedByUser: true,
        frames: {
          orderBy: { frameNumber: "asc" },
          include: {
            winnerEntry: {
              include: {
                members: {
                  include: {
                    player: true,
                  },
                  orderBy: { createdAt: "asc" },
                },
              },
            },
            breaks: {
              include: {
                player: true,
              },
              orderBy: { breakValue: "desc" },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("GET /api/matches/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch match",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existingMatch = await prisma.match.findUnique({
      where: { id },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (
      body.scheduleStatus &&
      !VALID_SCHEDULE_STATUSES.includes(body.scheduleStatus)
    ) {
      return NextResponse.json(
        { error: "scheduleStatus must be TBC or CONFIRMED" },
        { status: 400 }
      );
    }

    if (
      body.matchStatus &&
      !VALID_MATCH_STATUSES.includes(body.matchStatus)
    ) {
      return NextResponse.json(
        {
          error:
            "matchStatus must be one of SCHEDULED, IN_PROGRESS, COMPLETED, POSTPONED, CANCELLED, FORFEIT, ABANDONED",
        },
        { status: 400 }
      );
    }

    const tournamentId = body.tournamentId ?? existingMatch.tournamentId;
    const tournamentStageId =
      body.tournamentStageId ?? existingMatch.tournamentStageId;
    const stageRoundId = body.stageRoundId ?? existingMatch.stageRoundId;
    const tournamentGroupId =
      body.tournamentGroupId === null
        ? null
        : body.tournamentGroupId ?? existingMatch.tournamentGroupId;
    const venueId =
      body.venueId === null ? null : body.venueId ?? existingMatch.venueId;
    const homeEntryId = body.homeEntryId ?? existingMatch.homeEntryId;
    const awayEntryId = body.awayEntryId ?? existingMatch.awayEntryId;
    const winnerEntryId =
      body.winnerEntryId === null
        ? null
        : body.winnerEntryId ?? existingMatch.winnerEntryId;
    const approvedByUserId =
      body.approvedByUserId === null
        ? null
        : body.approvedByUserId ?? existingMatch.approvedByUserId;
    const enteredByUserId =
      body.enteredByUserId === null
        ? null
        : body.enteredByUserId ?? existingMatch.enteredByUserId;
    const updatedByUserId =
      body.updatedByUserId === null
        ? null
        : body.updatedByUserId ?? existingMatch.updatedByUserId;
    const requestedBestOfFrames =
      body.bestOfFrames === null || body.bestOfFrames === undefined
        ? null
        : Number(body.bestOfFrames);
    const frameHighBreaks = body.frameHighBreaks;

    if (homeEntryId === awayEntryId) {
      return NextResponse.json(
        { error: "homeEntryId and awayEntryId must be different" },
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

    const bestOfFrames =
      requestedBestOfFrames ?? existingMatch.bestOfFrames ?? round.bestOfFrames ?? 5;

    if (
      !Number.isInteger(bestOfFrames) ||
      bestOfFrames < 1 ||
      bestOfFrames % 2 === 0
    ) {
      return NextResponse.json(
        { error: "bestOfFrames must be an odd whole number greater than or equal to 1" },
        { status: 400 }
      );
    }

    if (
      frameHighBreaks !== undefined &&
      (
        !frameHighBreaks ||
        !Array.isArray(frameHighBreaks.home) ||
        !Array.isArray(frameHighBreaks.away)
      )
    ) {
      return NextResponse.json(
        { error: "frameHighBreaks must contain home and away arrays." },
        { status: 400 }
      );
    }

    if (frameHighBreaks) {
      if (
        frameHighBreaks.home.length !== bestOfFrames ||
        frameHighBreaks.away.length !== bestOfFrames
      ) {
        return NextResponse.json(
          {
            error:
              "frameHighBreaks arrays must match the number of frames in the match format.",
          },
          { status: 400 }
        );
      }

      const invalidHighBreak = [...frameHighBreaks.home, ...frameHighBreaks.away].find(
        (value) => value !== null && !isNonNegativeWholeNumber(value)
      );

      if (invalidHighBreak !== undefined) {
        return NextResponse.json(
          { error: "Each frame high break must be null or a whole number greater than or equal to 0." },
          { status: 400 }
        );
      }
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

    const entryIdsToCheck = [homeEntryId, awayEntryId];
    if (winnerEntryId) {
      entryIdsToCheck.push(winnerEntryId);
    }

    const entries = await prisma.tournamentEntry.findMany({
      where: {
        id: {
          in: entryIdsToCheck,
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

    const match = await prisma.$transaction(async (tx) => {
      const updated = await tx.match.update({
        where: { id },
        data: {
          tournamentId,
          tournamentStageId,
          stageRoundId,
          tournamentGroupId,
          venueId,
          matchDate:
            body.matchDate === null
              ? null
              : body.matchDate
              ? new Date(body.matchDate)
              : existingMatch.matchDate,
          matchTime:
            body.matchTime === null
              ? null
              : body.matchTime ?? existingMatch.matchTime,
          scheduleStatus: body.scheduleStatus ?? existingMatch.scheduleStatus,
          matchStatus: body.matchStatus ?? existingMatch.matchStatus,
          homeEntryId,
          awayEntryId,
          winnerEntryId,
          bestOfFrames,
          homeScore:
            body.homeScore === null
              ? null
              : body.homeScore ?? existingMatch.homeScore,
          awayScore:
            body.awayScore === null
              ? null
              : body.awayScore ?? existingMatch.awayScore,
          internalNote:
            body.internalNote === null
              ? null
              : body.internalNote ?? existingMatch.internalNote,
          publicNote:
            body.publicNote === null
              ? null
              : body.publicNote ?? existingMatch.publicNote,
          resultSubmittedAt:
            body.resultSubmittedAt === null
              ? null
              : body.resultSubmittedAt
              ? new Date(body.resultSubmittedAt)
              : existingMatch.resultSubmittedAt,
          approvedAt:
            body.approvedAt === null
              ? null
              : body.approvedAt
              ? new Date(body.approvedAt)
              : existingMatch.approvedAt,
          approvedByUserId,
          enteredByUserId,
          updatedByUserId,
        },
      });

      if (frameHighBreaks) {
        for (let index = 0; index < bestOfFrames; index += 1) {
          await tx.matchFrame.upsert({
            where: {
              matchId_frameNumber: {
                matchId: id,
                frameNumber: index + 1,
              },
            },
            create: {
              matchId: id,
              frameNumber: index + 1,
              homeHighBreak: frameHighBreaks.home[index],
              awayHighBreak: frameHighBreaks.away[index],
            },
            update: {
              homeHighBreak: frameHighBreaks.home[index],
              awayHighBreak: frameHighBreaks.away[index],
            },
          });
        }
      }

      await recalculateAndPersistPlayerElo(tx);

      return tx.match.findUniqueOrThrow({
        where: { id: updated.id },
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
                orderBy: { createdAt: "asc" },
              },
            },
          },
          awayEntry: {
            include: {
              members: {
                include: {
                  player: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
          winnerEntry: {
            include: {
              members: {
                include: {
                  player: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
          },
          approvedByUser: true,
          enteredByUser: true,
          updatedByUser: true,
          frames: {
            orderBy: { frameNumber: "asc" },
          },
        },
      });
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("PATCH /api/matches/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update match",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existingMatch = await prisma.match.findUnique({
      where: { id },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.delete({
        where: { id },
      });

      await recalculateAndPersistPlayerElo(tx);
    });

    return NextResponse.json({
      message: "Match deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/matches/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete match",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}