import { NextResponse } from "next/server";

import { resolveCurrentUser } from "@/lib/admin-auth";
import { getPendingMatchResultSubmissionsForMatches } from "@/lib/match-result-submission-store";
import { prisma } from "@/lib/prisma";
import { parseStoredMatchDateTime } from "@/lib/timezone";

type MatchEntryMember = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
};

function getEntryPhotoUrl(members: MatchEntryMember[]) {
  return members.map((member) => member.player.photoUrl?.trim() ?? "").find(Boolean) || null;
}

function formatEntryName(members: MatchEntryMember[]) {
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

export async function GET() {
  try {
    const currentUser = await resolveCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!currentUser.linkedPlayerId) {
      return NextResponse.json({ error: "Your account is not linked to a player profile." }, { status: 403 });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          {
            homeEntry: {
              members: {
                some: {
                  playerId: currentUser.linkedPlayerId,
                },
              },
            },
          },
          {
            awayEntry: {
              members: {
                some: {
                  playerId: currentUser.linkedPlayerId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        matchDate: true,
        matchTime: true,
        matchStatus: true,
        homeScore: true,
        awayScore: true,
        bestOfFrames: true,
        snookerFormat: true,
        venue: {
          select: {
            venueName: true,
          },
        },
        tournament: {
          select: {
            tournamentName: true,
            snookerFormat: true,
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
            members: {
              select: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    photoUrl: true,
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
            members: {
              select: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    photoUrl: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
    });

    const matchIds = matches.map((match) => match.id);
    const playerEntryIds = matches.flatMap((match) => {
      const entryIds: string[] = [];

      if (match.homeEntry.members.some((member) => member.player.id === currentUser.linkedPlayerId)) {
        entryIds.push(match.homeEntry.id);
      }

      if (match.awayEntry.members.some((member) => member.player.id === currentUser.linkedPlayerId)) {
        entryIds.push(match.awayEntry.id);
      }

      return entryIds;
    });

    const pendingSubmissionsByMatchId = await getPendingMatchResultSubmissionsForMatches(matchIds, playerEntryIds);

    return NextResponse.json({
      matches: matches.map((match) => {
        const currentEntryId = match.homeEntry.members.some((member) => member.player.id === currentUser.linkedPlayerId)
          ? match.homeEntry.id
          : match.awayEntry.id;
        const pendingSubmission = pendingSubmissionsByMatchId.get(match.id);
        const pendingMode = pendingSubmission
          ? pendingSubmission.targetEntryId === currentEntryId
            ? "awaitingYourReview"
            : pendingSubmission.submittedByEntryId === currentEntryId
              ? "submittedByYou"
              : "none"
          : "none";
        const pendingLabel = pendingMode === "awaitingYourReview"
          ? "Opponent submitted a result awaiting your approval"
          : pendingMode === "submittedByYou"
            ? "Result submitted and waiting for opponent approval"
            : null;
        const scheduledAt = parseStoredMatchDateTime(match.matchDate, match.matchTime)?.toISOString() ?? null;
        const homeName = formatEntryName(match.homeEntry.members);
        const awayName = formatEntryName(match.awayEntry.members);

        return {
          id: match.id,
          tournamentName: match.tournament.tournamentName,
          venue: match.venue?.venueName ?? "Venue TBC",
          stage: match.stageRound.roundName,
          dateTime: scheduledAt,
          status: formatMatchStatus(match.matchStatus),
          homePlayer: {
            name: homeName,
            initials: buildInitials(homeName),
            photoUrl: getEntryPhotoUrl(match.homeEntry.members),
          },
          awayPlayer: {
            name: awayName,
            initials: buildInitials(awayName),
            photoUrl: getEntryPhotoUrl(match.awayEntry.members),
          },
          scoreLine:
            typeof match.homeScore === "number" && typeof match.awayScore === "number"
              ? `${match.homeScore} - ${match.awayScore}`
              : "- : -",
          canSubmitResult: pendingMode !== "submittedByYou" && pendingMode !== "awaitingYourReview",
          pendingMode,
          pendingLabel,
          currentEntryId,
          bestOfFrames: match.bestOfFrames ?? match.stageRound.bestOfFrames ?? 5,
          snookerFormat: match.snookerFormat ?? match.stageRound.snookerFormat ?? match.tournament.snookerFormat ?? "REDS_15",
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/my-matches error:", error);

    return NextResponse.json(
      {
        error: "Failed to load your matches.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}