import { prisma } from "@/lib/prisma";

export const INITIAL_ELO = 1500;
const MATCH_RESULT_WEIGHT = 0.75;
const FRAME_SHARE_WEIGHT = 0.25;

type EloClient = Pick<typeof prisma, "player" | "match" | "playerEloHistory">;

export function calculateExpectedScore(playerRating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

function getKFactor(completedMatches: number) {
  if (completedMatches < 20) {
    return 32;
  }

  if (completedMatches < 50) {
    return 24;
  }

  return 16;
}

function getMatchSortTime(match: {
  matchDate: Date | null;
  approvedAt: Date | null;
  resultSubmittedAt: Date | null;
  createdAt: Date;
}) {
  return (
    match.matchDate?.getTime() ??
    match.approvedAt?.getTime() ??
    match.resultSubmittedAt?.getTime() ??
    match.createdAt.getTime()
  );
}

export async function recalculateAndPersistPlayerElo(client: EloClient) {
  const players = await client.player.findMany({
    select: {
      id: true,
    },
  });

  if (players.length === 0) {
    return;
  }

  const matches = await client.match.findMany({
    select: {
      id: true,
      matchDate: true,
      approvedAt: true,
      resultSubmittedAt: true,
      createdAt: true,
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
    },
  });

  const playerRatings = new Map(
    players.map((player) => [player.id, { eloRating: INITIAL_ELO, matchesPlayed: 0 }])
  );
  const historyEntries: Array<{
    playerId: string;
    matchId: string;
    ratingBefore: number;
    ratingAfter: number;
    ratingChange: number;
    matchesPlayed: number;
    expectedScore: number;
    actualScore: number;
    opponentAverage: number;
    matchDate: Date | null;
  }> = [];

  const sortedMatches = [...matches].sort((left, right) => getMatchSortTime(left) - getMatchSortTime(right));

  for (const match of sortedMatches) {
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

    const homeScore = match.homeScore;
    const awayScore = match.awayScore;
    const totalFrames = Math.max(homeScore + awayScore, 1);

    const homeMatchResult = homeScore === awayScore ? 0.5 : homeScore > awayScore ? 1 : 0;
    const awayMatchResult = 1 - homeMatchResult;
    const homeFrameShare = homeScore / totalFrames;
    const awayFrameShare = awayScore / totalFrames;
    const homeActualScore = MATCH_RESULT_WEIGHT * homeMatchResult + FRAME_SHARE_WEIGHT * homeFrameShare;
    const awayActualScore = MATCH_RESULT_WEIGHT * awayMatchResult + FRAME_SHARE_WEIGHT * awayFrameShare;

    const homeAverageRating =
      homePlayerIds.reduce((total, playerId) => total + (playerRatings.get(playerId)?.eloRating ?? INITIAL_ELO), 0) /
      homePlayerIds.length;
    const awayAverageRating =
      awayPlayerIds.reduce((total, playerId) => total + (playerRatings.get(playerId)?.eloRating ?? INITIAL_ELO), 0) /
      awayPlayerIds.length;

    const homeExpectedScore = calculateExpectedScore(homeAverageRating, awayAverageRating);
    const awayExpectedScore = 1 - homeExpectedScore;

    for (const playerId of homePlayerIds) {
      const rating = playerRatings.get(playerId);
      if (!rating) {
        continue;
      }

      const ratingBefore = Math.round(rating.eloRating);
      const kFactor = getKFactor(rating.matchesPlayed);
      rating.eloRating += kFactor * (homeActualScore - homeExpectedScore);
      rating.matchesPlayed += 1;
      const ratingAfter = Math.round(rating.eloRating);

      historyEntries.push({
        playerId,
        matchId: match.id,
        ratingBefore,
        ratingAfter,
        ratingChange: ratingAfter - ratingBefore,
        matchesPlayed: rating.matchesPlayed,
        expectedScore: homeExpectedScore,
        actualScore: homeActualScore,
        opponentAverage: awayAverageRating,
        matchDate: match.matchDate,
      });
    }

    for (const playerId of awayPlayerIds) {
      const rating = playerRatings.get(playerId);
      if (!rating) {
        continue;
      }

      const ratingBefore = Math.round(rating.eloRating);
      const kFactor = getKFactor(rating.matchesPlayed);
      rating.eloRating += kFactor * (awayActualScore - awayExpectedScore);
      rating.matchesPlayed += 1;
      const ratingAfter = Math.round(rating.eloRating);

      historyEntries.push({
        playerId,
        matchId: match.id,
        ratingBefore,
        ratingAfter,
        ratingChange: ratingAfter - ratingBefore,
        matchesPlayed: rating.matchesPlayed,
        expectedScore: awayExpectedScore,
        actualScore: awayActualScore,
        opponentAverage: homeAverageRating,
        matchDate: match.matchDate,
      });
    }
  }

  await client.player.updateMany({
    data: {
      eloRating: INITIAL_ELO,
    },
  });

  await client.playerEloHistory.deleteMany();

  for (const [playerId, rating] of playerRatings.entries()) {
    await client.player.update({
      where: { id: playerId },
      data: {
        eloRating: Math.round(rating.eloRating),
      },
    });
  }

  if (historyEntries.length > 0) {
    await client.playerEloHistory.createMany({
      data: historyEntries,
    });
  }
}