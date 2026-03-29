import type { HeadToHeadStatRow } from "@/components/HeadToHeadStats";
import { getFlagCdnUrl, normalizeCountryCode } from "@/lib/country";
import type { PublicLiveBroadcastState, PublicLiveMatchSnapshot } from "@/lib/live-match";
import { getPlayerRankings } from "@/lib/player-performance";
import { derivePublicLiveBroadcastState } from "@/lib/public-live-broadcast";
import { prisma } from "@/lib/prisma";
import { parseStoredMatchDateTime } from "@/lib/timezone";

function buildFullName(firstName: string, middleInitial: string | null, lastName: string) {
  return [firstName, middleInitial, lastName].filter(Boolean).join(" ");
}

function getEntryPlayerIds(
  members: Array<{ player: { id: string } }>
) {
  return Array.from(new Set(members.map((member) => member.player.id))).sort();
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sumNullable(values: Array<number | null | undefined>) {
  return values.reduce<number>((total, value) => total + (typeof value === "number" ? value : 0), 0);
}

function formatRankings(playerIds: string[], rankingPositions: Map<string, number>) {
  const labels = playerIds
    .map((playerId) => rankingPositions.get(playerId))
    .filter((position): position is number => typeof position === "number")
    .map((position) => `#${position}`);

  return labels.length > 0 ? labels.join(" / ") : "—";
}

function getEntryDisplayName(
  entry: {
    entryName: string | null;
    members: Array<{
      player: {
        firstName: string;
        middleInitial: string | null;
        lastName: string;
      };
    }>;
  } | null
) {
  if (!entry) {
    return "TBD";
  }

  if (entry.entryName?.trim()) {
    return entry.entryName.trim();
  }

  const names = entry.members.map((member) =>
    buildFullName(member.player.firstName, member.player.middleInitial, member.player.lastName)
  );

  return names.length > 0 ? names.join(" / ") : "TBD";
}

function getEntryPhotoUrl(
  entry: {
    members: Array<{
      player: {
        photoUrl: string | null;
      };
    }>;
  } | null
) {
  if (!entry) {
    return null;
  }

  return entry.members.map((member) => member.player.photoUrl?.trim() ?? "").find(Boolean) || null;
}

function getEntryCountryCode(
  entry: {
    members: Array<{
      player: {
        country: string | null;
      };
    }>;
  } | null
) {
  if (!entry) {
    return "";
  }

  const codes = Array.from(
    new Set(entry.members.map((member) => normalizeCountryCode(member.player.country ?? "")).filter(Boolean))
  );

  return codes.length === 1 ? codes[0] : "";
}

function buildStatsRows(
  match: {
    frames: Array<{
      homePoints: number | null;
      awayPoints: number | null;
      homeHighBreak: number | null;
      awayHighBreak: number | null;
      breaks: Array<{
        playerId: string;
        breakValue: number;
      }>;
    }>;
  },
  leftPlayerIds: string[],
  rightPlayerIds: string[],
  leftRanking: string,
  rightRanking: string
): HeadToHeadStatRow[] {
  const leftPointTotal = sumNullable(match.frames.map((frame) => frame.homePoints));
  const rightPointTotal = sumNullable(match.frames.map((frame) => frame.awayPoints));
  const leftHighestBreak = Math.max(0, ...match.frames.map((frame) => frame.homeHighBreak ?? 0));
  const rightHighestBreak = Math.max(0, ...match.frames.map((frame) => frame.awayHighBreak ?? 0));

  const breaks = match.frames.flatMap((frame) => frame.breaks);
  const leftBreaks = breaks.filter((entry) => leftPlayerIds.includes(entry.playerId));
  const rightBreaks = breaks.filter((entry) => rightPlayerIds.includes(entry.playerId));

  return [
    {
      label: "Ranking",
      leftValue: leftRanking,
      rightValue: rightRanking,
      highlightLeader: false,
    },
    {
      label: "Total Match Points",
      leftValue: leftPointTotal,
      rightValue: rightPointTotal,
    },
    {
      label: "Highest Break",
      leftValue: leftHighestBreak,
      rightValue: rightHighestBreak,
    },
    {
      label: "Pot Success",
      leftValue: "—",
      rightValue: "—",
      highlightLeader: false,
    },
    {
      label: "Long Pot",
      leftValue: "—",
      rightValue: "—",
      highlightLeader: false,
    },
    {
      label: "50+ Breaks",
      leftValue: leftBreaks.filter((entry) => entry.breakValue >= 50).length,
      rightValue: rightBreaks.filter((entry) => entry.breakValue >= 50).length,
    },
    {
      label: "100+ Breaks",
      leftValue: leftBreaks.filter((entry) => entry.breakValue >= 100).length,
      rightValue: rightBreaks.filter((entry) => entry.breakValue >= 100).length,
    },
  ];
}

type VisibleLiveSession = {
  status: string;
  homeFramesWon: number | null;
  awayFramesWon: number | null;
  currentFrameNumber: number | null;
  currentFrameHomePoints: number | null;
  currentFrameAwayPoints: number | null;
  activeSide: string | null;
  scoringState: unknown;
  homeStartedAt: Date | null;
  awayStartedAt: Date | null;
  lastSyncedAt: Date | null;
};

function getVisibleLiveSession(liveSession: VisibleLiveSession | null) {
  if (!liveSession?.homeStartedAt && !liveSession?.awayStartedAt) {
    return null;
  }

  return liveSession;
}

export type PublicMatchCentreData = {
  matchId: string;
  matchesHref: string;
  matchCentreHref: string;
  bestOfFrames: number;
  tournamentName: string;
  seasonName: string;
  roundName: string;
  scheduledAt: string | null;
  liveStartedAt: string | null;
  venueLabel: string;
  initialSnapshot: PublicLiveMatchSnapshot;
  initialDetails: PublicLiveBroadcastState | null;
  leftPlayerName: string;
  rightPlayerName: string;
  leftPlayerHref?: string;
  rightPlayerHref?: string;
  leftPlayerPhoto: string | null;
  rightPlayerPhoto: string | null;
  leftPlayerFlagUrl: string | null;
  leftPlayerFlagAlt: string;
  rightPlayerFlagUrl: string | null;
  rightPlayerFlagAlt: string;
  headToHead: {
    leftWins: number;
    rightWins: number;
  };
  stats: HeadToHeadStatRow[];
};

export async function getPublicMatchCentreData(
  id: string,
  requestedGroupId = ""
): Promise<PublicMatchCentreData | null> {
  const match = await prisma.match.findFirst({
    where: {
      id,
      tournament: {
        isPublished: true,
      },
    },
    select: {
      id: true,
      matchDate: true,
      matchTime: true,
      bestOfFrames: true,
      matchStatus: true,
      scheduleStatus: true,
      homeScore: true,
      awayScore: true,
      publicNote: true,
      updatedAt: true,
      liveSession: {
        select: {
          status: true,
          homeFramesWon: true,
          awayFramesWon: true,
          currentFrameNumber: true,
          currentFrameHomePoints: true,
          currentFrameAwayPoints: true,
          activeSide: true,
          scoringState: true,
          homeStartedAt: true,
          awayStartedAt: true,
          lastSyncedAt: true,
        },
      },
      tournament: {
        select: {
          id: true,
          tournamentName: true,
          season: {
            select: {
              seasonName: true,
            },
          },
          venue: {
            select: {
              venueName: true,
              city: true,
              stateProvince: true,
            },
          },
        },
      },
      stageRound: {
        select: {
          roundName: true,
          bestOfFrames: true,
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
                  middleInitial: true,
                  lastName: true,
                  country: true,
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
          entryName: true,
          members: {
            select: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  middleInitial: true,
                  lastName: true,
                  country: true,
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
      frames: {
        orderBy: {
          frameNumber: "asc",
        },
        select: {
          homePoints: true,
          awayPoints: true,
          homeHighBreak: true,
          awayHighBreak: true,
          breaks: {
            select: {
              playerId: true,
              breakValue: true,
            },
          },
        },
      },
    },
  });

  if (!match) {
    return null;
  }

  const leftPlayerIds = getEntryPlayerIds(match.homeEntry.members);
  const rightPlayerIds = getEntryPlayerIds(match.awayEntry.members);

  const [historicalMatches, rankings] = await Promise.all([
    prisma.match.findMany({
      where: {
        OR: [
          {
            homeEntry: {
              members: {
                some: {
                  playerId: {
                    in: leftPlayerIds,
                  },
                },
              },
            },
            awayEntry: {
              members: {
                some: {
                  playerId: {
                    in: rightPlayerIds,
                  },
                },
              },
            },
          },
          {
            homeEntry: {
              members: {
                some: {
                  playerId: {
                    in: rightPlayerIds,
                  },
                },
              },
            },
            awayEntry: {
              members: {
                some: {
                  playerId: {
                    in: leftPlayerIds,
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        homeScore: true,
        awayScore: true,
        matchStatus: true,
        homeEntry: {
          select: {
            members: {
              select: {
                player: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        awayEntry: {
          select: {
            members: {
              select: {
                player: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    getPlayerRankings(),
  ]);

  const headToHead = historicalMatches.reduce(
    (accumulator, item) => {
      const hasScore = typeof item.homeScore === "number" && typeof item.awayScore === "number";
      const isCompleted = item.matchStatus === "COMPLETED" || hasScore;

      if (!isCompleted || !hasScore || item.homeScore === item.awayScore) {
        return accumulator;
      }

      const itemHomeIds = getEntryPlayerIds(item.homeEntry.members);
      const itemAwayIds = getEntryPlayerIds(item.awayEntry.members);

      const isDirectLeftRight = sameIds(itemHomeIds, leftPlayerIds) && sameIds(itemAwayIds, rightPlayerIds);
      const isDirectRightLeft = sameIds(itemHomeIds, rightPlayerIds) && sameIds(itemAwayIds, leftPlayerIds);

      if (!isDirectLeftRight && !isDirectRightLeft) {
        return accumulator;
      }

      if (isDirectLeftRight) {
        if ((item.homeScore ?? 0) > (item.awayScore ?? 0)) {
          accumulator.leftWins += 1;
        } else {
          accumulator.rightWins += 1;
        }
      } else if ((item.homeScore ?? 0) > (item.awayScore ?? 0)) {
        accumulator.rightWins += 1;
      } else {
        accumulator.leftWins += 1;
      }

      return accumulator;
    },
    { leftWins: 0, rightWins: 0 }
  );

  const scheduledAt = parseStoredMatchDateTime(match.matchDate, match.matchTime)?.toISOString() ?? null;
  const leftName = getEntryDisplayName(match.homeEntry);
  const rightName = getEntryDisplayName(match.awayEntry);
  const rankingPositions = new Map(rankings.map((player, index) => [player.id, index + 1]));
  const leftRanking = formatRankings(leftPlayerIds, rankingPositions);
  const rightRanking = formatRankings(rightPlayerIds, rankingPositions);
  const stats = buildStatsRows(match, leftPlayerIds, rightPlayerIds, leftRanking, rightRanking);
  const leftCountryCode = getEntryCountryCode(match.homeEntry);
  const rightCountryCode = getEntryCountryCode(match.awayEntry);
  const venueLabel = [match.tournament.venue?.venueName, match.tournament.venue?.city, match.tournament.venue?.stateProvince]
    .filter(Boolean)
    .join(", ");
  const matchesHref = requestedGroupId ? `/matches?group=${encodeURIComponent(requestedGroupId)}` : "/matches";
  const matchCentreHref = requestedGroupId ? `/matches/${id}?group=${encodeURIComponent(requestedGroupId)}` : `/matches/${id}`;
  const liveSession = getVisibleLiveSession(match.liveSession);
  const liveStartedAt = liveSession
    ? [liveSession.homeStartedAt, liveSession.awayStartedAt]
        .filter((value): value is Date => value instanceof Date)
        .sort((left, right) => left.getTime() - right.getTime())[0]?.toISOString() ?? null
    : null;
  const initialSnapshot: PublicLiveMatchSnapshot = {
    id: match.id,
    fixtureGroupIdentifier: match.tournament.id,
    homeScore: liveSession?.homeFramesWon ?? match.homeScore,
    awayScore: liveSession?.awayFramesWon ?? match.awayScore,
    matchStatus:
      liveSession?.status === "ACTIVE" || liveSession?.status === "PAUSED"
        ? "IN_PROGRESS"
        : liveSession?.status === "COMPLETED"
          ? "COMPLETED"
          : liveSession?.status === "ABANDONED"
            ? "ABANDONED"
            : match.matchStatus,
    scheduleStatus: match.scheduleStatus,
    publicNote: match.publicNote,
    liveSessionStatus: liveSession?.status ?? null,
    currentFrameNumber: liveSession?.currentFrameNumber ?? null,
    currentFrameHomePoints: liveSession?.currentFrameHomePoints ?? null,
    currentFrameAwayPoints: liveSession?.currentFrameAwayPoints ?? null,
    activeSide:
      liveSession?.activeSide === "home" || liveSession?.activeSide === "away"
        ? liveSession.activeSide
        : null,
    updatedAt: (liveSession?.lastSyncedAt ?? match.updatedAt).toISOString(),
  };
  const initialDetails: PublicLiveBroadcastState | null = liveSession?.scoringState
    ? derivePublicLiveBroadcastState(liveSession.scoringState)
    : null;

  return {
    matchId: match.id,
    matchesHref,
    matchCentreHref,
    bestOfFrames: match.bestOfFrames ?? match.stageRound?.bestOfFrames ?? 5,
    tournamentName: match.tournament.tournamentName,
    seasonName: match.tournament.season.seasonName,
    roundName: match.stageRound?.roundName ?? "Match",
    scheduledAt,
    liveStartedAt,
    venueLabel,
    initialSnapshot,
    initialDetails,
    leftPlayerName: leftName,
    rightPlayerName: rightName,
    leftPlayerHref: leftPlayerIds.length === 1 ? `/players/${leftPlayerIds[0]}` : undefined,
    rightPlayerHref: rightPlayerIds.length === 1 ? `/players/${rightPlayerIds[0]}` : undefined,
    leftPlayerPhoto: getEntryPhotoUrl(match.homeEntry),
    rightPlayerPhoto: getEntryPhotoUrl(match.awayEntry),
    leftPlayerFlagUrl: leftCountryCode ? getFlagCdnUrl(leftCountryCode, "w40") : null,
    leftPlayerFlagAlt: leftCountryCode,
    rightPlayerFlagUrl: rightCountryCode ? getFlagCdnUrl(rightCountryCode, "w40") : null,
    rightPlayerFlagAlt: rightCountryCode,
    headToHead,
    stats,
  };
}