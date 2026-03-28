import { prisma } from "@/lib/prisma";
import { normalizeCountryCode } from "@/lib/country";
import { calculateExpectedScore, INITIAL_ELO } from "@/lib/player-elo";
import { publicApiJson, publicApiOptions } from "@/lib/public-api-response";
import { parseStoredMatchDateTime } from "@/lib/timezone";

type PlayerLike = {
  id?: string;
  firstName: string;
  middleInitial?: string | null;
  lastName: string;
  country?: string | null;
  photoUrl?: string | null;
  eloRating?: number | null;
};

type EntryMemberLike = {
  player: PlayerLike;
};

type EntryLike = {
  id: string;
  entryName: string | null;
  members: EntryMemberLike[];
};

function getEntryPrimaryPlayerId(entry: EntryLike | null | undefined) {
  if (!entry || entry.members.length !== 1) {
    return null;
  }

  const playerId = entry.members[0]?.player.id;
  return typeof playerId === "string" && playerId.trim() ? playerId : null;
}

export function OPTIONS() {
  return publicApiOptions();
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toCompactDateTime(date: Date | null, matchTime?: string | null) {
  const scheduledAt = parseStoredMatchDateTime(date, matchTime);

  if (!scheduledAt) return "";

  const year = scheduledAt.getUTCFullYear();
  const month = pad2(scheduledAt.getUTCMonth() + 1);
  const day = pad2(scheduledAt.getUTCDate());
  const hours = scheduledAt.getUTCHours();
  const minutes = scheduledAt.getUTCMinutes();

  return `${year}${month}${day} ${pad2(hours)}:${pad2(minutes)}`;
}

function toIsoDateTime(date: Date | null, matchTime?: string | null) {
  return parseStoredMatchDateTime(date, matchTime)?.toISOString() ?? "";
}

function toTimeString(date: Date | null, matchTime?: string | null) {
  if (matchTime?.trim()) return matchTime.trim();
  if (!date) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function getEntryDisplayName(entry: EntryLike | null | undefined) {
  if (!entry) return "TBD";

  if (entry.entryName?.trim()) return entry.entryName.trim();

  const names = entry.members
    .map((member) => {
      const first = member.player.firstName?.trim() ?? "";
      const middle = member.player.middleInitial?.trim() ?? "";
      const last = member.player.lastName?.trim() ?? "";
      return [first, middle, last].filter(Boolean).join(" ");
    })
    .filter(Boolean);

  if (names.length === 0) return "TBD";
  if (names.length === 1) return names[0];

  return names.join(" / ");
}

function getEntryCountryCode(entry: EntryLike | null | undefined) {
  if (!entry) return "";

  const codes = Array.from(
    new Set(
      entry.members
        .map((member) => normalizeCountryCode(member.player.country ?? ""))
        .filter(Boolean)
    )
  );

  if (codes.length === 1) return codes[0];
  return "";
}

function getEntryPhotoUrl(entry: EntryLike | null | undefined) {
  if (!entry) return null;

  return (
    entry.members
      .map((member) => member.player.photoUrl?.trim() ?? "")
      .find(Boolean) || null
  );
}

function getEntryAverageElo(entry: EntryLike | null | undefined) {
  if (!entry || entry.members.length === 0) {
    return null;
  }

  const ratings = entry.members.map((member) => member.player.eloRating ?? INITIAL_ELO);
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fixtureGroupIdentifier = searchParams.get("fixtureGroupIdentifier")?.trim() || null;

    const matches = await prisma.match.findMany({
      where: {
        tournament: {
          isPublished: true,
          ...(fixtureGroupIdentifier ? { id: fixtureGroupIdentifier } : {}),
        },
      },
      include: {
        tournament: {
          select: {
            id: true,
            tournamentName: true,
            seasonId: true,
            season: {
              select: {
                seasonName: true,
              },
            },
          },
        },
        stageRound: {
          select: {
            id: true,
            roundName: true,
            roundType: true,
          },
        },
        homeEntry: {
          select: {
            id: true,
            entryName: true,
            members: {
              include: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    middleInitial: true,
                    lastName: true,
                    country: true,
                    photoUrl: true,
                    eloRating: true,
                  },
                },
              },
            },
          },
        },
        awayEntry: {
          select: {
            id: true,
            entryName: true,
            members: {
              include: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    middleInitial: true,
                    lastName: true,
                    country: true,
                    photoUrl: true,
                    eloRating: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { matchDate: "asc" },
        { matchTime: "asc" },
        { createdAt: "asc" },
      ],
    });

    const fixtures = matches.map((match) => {
      const homeName = getEntryDisplayName(match.homeEntry);
      const awayName = getEntryDisplayName(match.awayEntry);
      const homeCountryCode = getEntryCountryCode(match.homeEntry);
      const roadCountryCode = getEntryCountryCode(match.awayEntry);
      const fixtureDate = toCompactDateTime(match.matchDate, match.matchTime);
      const fixtureDateTime = toIsoDateTime(match.matchDate, match.matchTime);
      const fixtureTime = toTimeString(match.matchDate, match.matchTime);
      const homeAverageElo = getEntryAverageElo(match.homeEntry);
      const awayAverageElo = getEntryAverageElo(match.awayEntry);
      const homeWinProbability =
        homeAverageElo !== null && awayAverageElo !== null
          ? calculateExpectedScore(homeAverageElo, awayAverageElo)
          : null;
      const awayWinProbability = homeWinProbability === null ? null : 1 - homeWinProbability;

      return {
        id: match.id,
        fixtureId: match.id,
        fixtureDate,
        fixtureDateTime,
        fixtureTime,
        homeTeamName: homeName,
        roadTeamName: awayName,
        homeCountryCode,
        roadCountryCode,
        homePlayerId: getEntryPrimaryPlayerId(match.homeEntry),
        roadPlayerId: getEntryPrimaryPlayerId(match.awayEntry),
        homePlayerPhotoUrl: getEntryPhotoUrl(match.homeEntry),
        roadPlayerPhotoUrl: getEntryPhotoUrl(match.awayEntry),
        homeWinProbability,
        roadWinProbability: awayWinProbability,
        homeScore: match.homeScore,
        roadScore: match.awayScore,
        fixtureGroupIdentifier: match.tournament.id,
        fixtureGroupDesc: match.tournament.tournamentName,
        roundDesc: match.stageRound.roundName,
        roundType: match.stageRound.roundType,
        seasonId: match.tournament.seasonId,
        seasonDesc: match.tournament.season.seasonName,
        matchStatus: match.matchStatus,
        scheduleStatus: match.scheduleStatus,
      };
    });

    return publicApiJson({
      count: fixtures.length,
      fixtures,
    });
  } catch (error) {
    console.error("Failed to load public fixtures", error);

    return publicApiJson(
      { error: "Failed to load public fixtures" },
      { status: 500 }
    );
  }
}