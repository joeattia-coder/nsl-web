import { NextResponse } from "next/server";

import { resolveCurrentUser } from "@/lib/admin-auth";
import {
  getMatchResultSubmissionFrames,
  getPendingMatchResultSubmissionForMatch,
} from "@/lib/match-result-submission-store";
import { prisma } from "@/lib/prisma";
import { parseStoredMatchDateTime } from "@/lib/timezone";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function formatEntryName(
  members: Array<{
    player: {
      firstName: string;
      lastName: string;
    };
  }>
) {
  const names = members.map((member) => `${member.player.firstName} ${member.player.lastName}`.trim());

  if (names.length === 0) {
    return "TBD";
  }

  return names.join(" / ");
}

function buildInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
}

function formatMatchStatus(matchStatus: string) {
  return matchStatus
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!currentUser.linkedPlayerId) {
      return NextResponse.json({ error: "Your account is not linked to a player profile." }, { status: 403 });
    }

    const { id } = await context.params;
    const match = await prisma.match.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        tournamentId: true,
        matchDate: true,
        matchTime: true,
        matchStatus: true,
        homeScore: true,
        awayScore: true,
        resultSubmittedAt: true,
        bestOfFrames: true,
        snookerFormat: true,
        tournament: {
          select: {
            tournamentName: true,
            snookerFormat: true,
          },
        },
        venue: {
          select: {
            venueName: true,
          },
        },
        stageRound: {
          select: {
            roundName: true,
            bestOfFrames: true,
            snookerFormat: true,
          },
        },
        homeEntry: {
          select: {
            id: true,
            entryName: true,
            members: {
              select: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    photoUrl: true,
                    country: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        awayEntry: {
          select: {
            id: true,
            entryName: true,
            members: {
              select: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    photoUrl: true,
                    country: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
        frames: {
          orderBy: {
            frameNumber: "asc",
          },
          select: {
            id: true,
            frameNumber: true,
            winnerEntryId: true,
            homePoints: true,
            awayPoints: true,
            homeHighBreak: true,
            awayHighBreak: true,
            breaks: {
              orderBy: [{ breakValue: "desc" }, { createdAt: "asc" }],
              select: {
                id: true,
                breakValue: true,
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const isHomePlayer = match.homeEntry.members.some((member) => member.player.id === currentUser.linkedPlayerId);
    const isAwayPlayer = match.awayEntry.members.some((member) => member.player.id === currentUser.linkedPlayerId);

    if (!isHomePlayer && !isAwayPlayer) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const currentEntry = isHomePlayer ? match.homeEntry : match.awayEntry;
    const opponentEntry = isHomePlayer ? match.awayEntry : match.homeEntry;
    const scheduledAt = parseStoredMatchDateTime(match.matchDate, match.matchTime)?.toISOString() ?? null;
    const pendingSubmission = await getPendingMatchResultSubmissionForMatch(match.id);
    const relevantPendingSubmission = pendingSubmission && (
      pendingSubmission.submittedByEntryId === currentEntry.id ||
      pendingSubmission.targetEntryId === currentEntry.id
    )
      ? pendingSubmission
      : null;
    const pendingFrames = relevantPendingSubmission
      ? await getMatchResultSubmissionFrames(relevantPendingSubmission.id)
      : [];

    return NextResponse.json({
      match: {
        id: match.id,
        tournamentId: match.tournamentId,
        tournamentName: match.tournament.tournamentName,
        venue: match.venue?.venueName ?? "Venue TBC",
        stage: match.stageRound.roundName,
        dateTime: scheduledAt,
        status: formatMatchStatus(match.matchStatus),
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        resultSubmittedAt: match.resultSubmittedAt?.toISOString() ?? null,
        bestOfFrames: match.bestOfFrames ?? match.stageRound.bestOfFrames ?? 5,
        snookerFormat: match.snookerFormat ?? match.stageRound.snookerFormat ?? match.tournament.snookerFormat ?? "REDS_15",
        currentSide: isHomePlayer ? "home" : "away",
        currentEntryId: currentEntry.id,
        opponentEntryId: opponentEntry.id,
        homeEntry: {
          id: match.homeEntry.id,
          label: match.homeEntry.entryName?.trim() || formatEntryName(match.homeEntry.members),
          members: match.homeEntry.members.map((member) => ({
            id: member.player.id,
            fullName: `${member.player.firstName} ${member.player.lastName}`.trim(),
            initials: buildInitials(`${member.player.firstName} ${member.player.lastName}`),
            photoUrl: member.player.photoUrl?.trim() || null,
            country: member.player.country?.trim() || null,
          })),
        },
        awayEntry: {
          id: match.awayEntry.id,
          label: match.awayEntry.entryName?.trim() || formatEntryName(match.awayEntry.members),
          members: match.awayEntry.members.map((member) => ({
            id: member.player.id,
            fullName: `${member.player.firstName} ${member.player.lastName}`.trim(),
            initials: buildInitials(`${member.player.firstName} ${member.player.lastName}`),
            photoUrl: member.player.photoUrl?.trim() || null,
            country: member.player.country?.trim() || null,
          })),
        },
        frames: match.frames.map((frame) => ({
          id: frame.id,
          frameNumber: frame.frameNumber,
          winnerEntryId: frame.winnerEntryId,
          homePoints: frame.homePoints,
          awayPoints: frame.awayPoints,
          homeHighBreak: frame.homeHighBreak,
          awayHighBreak: frame.awayHighBreak,
          breaks: frame.breaks.map((entry) => ({
            id: entry.id,
            breakValue: entry.breakValue,
            playerId: entry.player.id,
            playerName: `${entry.player.firstName} ${entry.player.lastName}`.trim(),
            side: match.homeEntry.members.some((member) => member.player.id === entry.player.id) ? "home" : "away",
          })),
        })),
        pendingSubmission: relevantPendingSubmission
          ? {
              id: relevantPendingSubmission.id,
              mode:
                relevantPendingSubmission.targetEntryId === currentEntry.id
                  ? "awaitingYourReview"
                  : relevantPendingSubmission.submittedByEntryId === currentEntry.id
                    ? "submittedByYou"
                    : "none",
              homeScore: relevantPendingSubmission.homeScore,
              awayScore: relevantPendingSubmission.awayScore,
              winnerEntryId: relevantPendingSubmission.winnerEntryId,
              summaryNote: relevantPendingSubmission.summaryNote,
              submittedAt: relevantPendingSubmission.submittedAt.toISOString(),
              proposedMatchDate: relevantPendingSubmission.proposedMatchDate?.toISOString() ?? null,
              proposedMatchTime: relevantPendingSubmission.proposedMatchTime,
              proposedEndedAt: relevantPendingSubmission.proposedEndedAt?.toISOString() ?? null,
              frames: pendingFrames,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/my-matches/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to load match details.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}