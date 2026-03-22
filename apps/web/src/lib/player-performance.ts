import { prisma } from "@/lib/prisma";

export type PlayerRankingRow = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  framesWon: number;
  framesLost: number;
  frameDifferential: number;
  highBreak: number;
  highBreakCumulative: number;
  points: number;
  eloRating: number;
  photoUrl?: string;
  country?: string;
};

export function buildFullName(firstName: string, middleInitial: string | null, lastName: string) {
  return [firstName, middleInitial, lastName].filter(Boolean).join(" ");
}

export function compareAlphabeticalPlayers(
  left: { firstName: string; lastName: string },
  right: { firstName: string; lastName: string }
) {
  const firstNameComparison = left.firstName.localeCompare(right.firstName, undefined, {
    sensitivity: "base",
  });

  if (firstNameComparison !== 0) {
    return firstNameComparison;
  }

  return left.lastName.localeCompare(right.lastName, undefined, {
    sensitivity: "base",
  });
}

export function compareRankingRows(left: PlayerRankingRow, right: PlayerRankingRow) {
  const leftHasPlayed = left.matchesPlayed > 0;
  const rightHasPlayed = right.matchesPlayed > 0;

  if (leftHasPlayed !== rightHasPlayed) {
    return leftHasPlayed ? -1 : 1;
  }

  if (!leftHasPlayed && !rightHasPlayed) {
    return compareAlphabeticalPlayers(left, right);
  }

  if (right.points !== left.points) {
    return right.points - left.points;
  }

  if (right.frameDifferential !== left.frameDifferential) {
    return right.frameDifferential - left.frameDifferential;
  }

  if (right.eloRating !== left.eloRating) {
    return right.eloRating - left.eloRating;
  }

  return compareAlphabeticalPlayers(left, right);
}

export async function getPlayerRankings() {
  const players = await prisma.player.findMany({
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      eloRating: true,
      photoUrl: true,
      country: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const matches = await prisma.match.findMany({
    select: {
      id: true,
      matchStatus: true,
      homeScore: true,
      awayScore: true,
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
      frames: {
        select: {
          homeHighBreak: true,
          awayHighBreak: true,
        },
      },
    },
  });

  const playerStats = new Map<string, PlayerRankingRow>(
    players.map((player) => {
      const fullName = buildFullName(player.firstName, player.middleInitial, player.lastName);
      return [
        player.id,
        {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          fullName,
          name: fullName,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          framesWon: 0,
          framesLost: 0,
          frameDifferential: 0,
          highBreak: 0,
          highBreakCumulative: 0,
          points: 0,
          eloRating: player.eloRating,
          photoUrl: player.photoUrl ?? undefined,
          country: player.country ?? undefined,
        },
      ];
    })
  );

  for (const match of matches) {
    const hasScore = typeof match.homeScore === "number" && typeof match.awayScore === "number";
    const isCompleted = match.matchStatus === "COMPLETED" || hasScore;

    if (!isCompleted || !hasScore || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const homePlayerIds = [...new Set(match.homeEntry.members.map((member) => member.player.id))];
    const awayPlayerIds = [...new Set(match.awayEntry.members.map((member) => member.player.id))];

    if (homePlayerIds.length === 0 || awayPlayerIds.length === 0) {
      continue;
    }

    for (const playerId of homePlayerIds) {
      const stats = playerStats.get(playerId);

      if (!stats) {
        continue;
      }

      stats.matchesPlayed += 1;
      stats.framesWon += match.homeScore;
      stats.framesLost += match.awayScore;
      stats.frameDifferential += match.homeScore - match.awayScore;

      if (match.homeScore > match.awayScore) {
        stats.matchesWon += 1;
        stats.points += 1;
      } else if (match.homeScore < match.awayScore) {
        stats.matchesLost += 1;
      }

      for (const frame of match.frames) {
        const breakValue = frame.homeHighBreak ?? 0;
        stats.highBreak = Math.max(stats.highBreak, breakValue);
        stats.highBreakCumulative += breakValue;
      }
    }

    for (const playerId of awayPlayerIds) {
      const stats = playerStats.get(playerId);

      if (!stats) {
        continue;
      }

      stats.matchesPlayed += 1;
      stats.framesWon += match.awayScore;
      stats.framesLost += match.homeScore;
      stats.frameDifferential += match.awayScore - match.homeScore;

      if (match.awayScore > match.homeScore) {
        stats.matchesWon += 1;
        stats.points += 1;
      } else if (match.awayScore < match.homeScore) {
        stats.matchesLost += 1;
      }

      for (const frame of match.frames) {
        const breakValue = frame.awayHighBreak ?? 0;
        stats.highBreak = Math.max(stats.highBreak, breakValue);
        stats.highBreakCumulative += breakValue;
      }
    }
  }

  return Array.from(playerStats.values()).sort(compareRankingRows);
}

function formatEntryName(members: Array<{ player: { firstName: string; middleInitial: string | null; lastName: string } }>) {
  const names = members.map((member) =>
    buildFullName(member.player.firstName, member.player.middleInitial, member.player.lastName)
  );

  return names.length > 0 ? names.join(" / ") : "TBD";
}

export async function getPlayerDashboardData(playerId: string) {
  const [player, rankings, eloHistory] = await Promise.all([
    prisma.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        photoUrl: true,
        eloRating: true,
        updatedAt: true,
      },
    }),
    getPlayerRankings(),
    prisma.playerEloHistory.findMany({
      where: {
        playerId,
      },
      select: {
        id: true,
        ratingBefore: true,
        ratingAfter: true,
        ratingChange: true,
        matchesPlayed: true,
        expectedScore: true,
        actualScore: true,
        opponentAverage: true,
        matchDate: true,
        match: {
          select: {
            id: true,
            homeScore: true,
            awayScore: true,
            matchDate: true,
            tournament: {
              select: {
                tournamentName: true,
              },
            },
            stageRound: {
              select: {
                roundName: true,
              },
            },
            homeEntry: {
              select: {
                members: {
                  select: {
                    player: {
                      select: {
                        firstName: true,
                        middleInitial: true,
                        lastName: true,
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
                members: {
                  select: {
                    player: {
                      select: {
                        firstName: true,
                        middleInitial: true,
                        lastName: true,
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
        },
      },
      orderBy: [{ matchDate: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
  ]);

  if (!player) {
    return null;
  }

  const stats = rankings.find((entry) => entry.id === playerId) ?? null;
  const rankingPosition = stats ? rankings.findIndex((entry) => entry.id === playerId) + 1 : null;
  const winPercentage = stats && stats.matchesPlayed > 0
    ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
    : 0;

  return {
    player: {
      id: player.id,
      fullName: buildFullName(player.firstName, player.middleInitial, player.lastName),
      photoUrl: player.photoUrl,
      eloRating: player.eloRating,
      updatedAt: player.updatedAt.toISOString(),
    },
    rankingPosition,
    stats,
    winPercentage,
    eloHistory: eloHistory.map((entry) => ({
      id: entry.id,
      ratingBefore: entry.ratingBefore,
      ratingAfter: entry.ratingAfter,
      ratingChange: entry.ratingChange,
      matchesPlayed: entry.matchesPlayed,
      expectedScore: entry.expectedScore,
      actualScore: entry.actualScore,
      opponentAverage: Math.round(entry.opponentAverage),
      matchDate: (entry.matchDate ?? entry.match.matchDate)?.toISOString() ?? null,
      tournamentName: entry.match.tournament.tournamentName,
      roundName: entry.match.stageRound.roundName,
      homeScore: entry.match.homeScore,
      awayScore: entry.match.awayScore,
      homeEntryName: formatEntryName(entry.match.homeEntry.members),
      awayEntryName: formatEntryName(entry.match.awayEntry.members),
    })),
  };
}