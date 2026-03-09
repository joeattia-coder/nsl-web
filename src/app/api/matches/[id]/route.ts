import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const match = await prisma.match.update({
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

    await prisma.match.delete({
      where: { id },
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