import { prisma } from "@/lib/prisma";

type EntryMemberSummary = {
  playerId: string;
  playerName: string;
  email: string | null;
};

type MatchEntrySummary = {
  id: string;
  label: string;
  members: EntryMemberSummary[];
};

export type PlayerMatchAccessContext = {
  match: {
    id: string;
    tournamentId: string;
    matchDate: Date | null;
    matchTime: string | null;
    matchStatus: string;
    homeScore: number | null;
    awayScore: number | null;
    resultSubmittedAt: Date | null;
    bestOfFrames: number | null;
    tournamentName: string;
    venueLabel: string;
    roundName: string;
  };
  homeEntry: MatchEntrySummary;
  awayEntry: MatchEntrySummary;
  currentEntry: MatchEntrySummary;
  opponentEntry: MatchEntrySummary;
};

function formatEntryName(members: EntryMemberSummary[]) {
  if (members.length === 0) {
    return "TBD";
  }

  return members.map((member) => member.playerName).join(" / ");
}

function mapEntry(entry: {
  id: string;
  entryName: string | null;
  members: Array<{
    player: {
      id: string;
      firstName: string;
      lastName: string;
      emailAddress: string | null;
      user: {
        email: string | null;
      } | null;
    };
  }>;
}): MatchEntrySummary {
  const members = entry.members.map((member) => ({
    playerId: member.player.id,
    playerName: `${member.player.firstName} ${member.player.lastName}`.trim(),
    email: member.player.user?.email?.trim() || member.player.emailAddress?.trim() || null,
  }));

  return {
    id: entry.id,
    label: entry.entryName?.trim() || formatEntryName(members),
    members,
  };
}

export async function getPlayerMatchAccessContext(matchId: string, linkedPlayerId: string) {
  const match = await prisma.match.findUnique({
    where: {
      id: matchId,
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
      tournament: {
        select: {
          tournamentName: true,
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
        },
      },
      homeEntry: {
        select: {
          id: true,
          entryName: true,
          members: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  emailAddress: true,
                  user: {
                    select: {
                      email: true,
                    },
                  },
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
            orderBy: {
              createdAt: "asc",
            },
            select: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  emailAddress: true,
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!match) {
    return null;
  }

  const homeEntry = mapEntry(match.homeEntry);
  const awayEntry = mapEntry(match.awayEntry);
  const isHomePlayer = homeEntry.members.some((member) => member.playerId === linkedPlayerId);
  const isAwayPlayer = awayEntry.members.some((member) => member.playerId === linkedPlayerId);

  if (!isHomePlayer && !isAwayPlayer) {
    return null;
  }

  const currentEntry = isHomePlayer ? homeEntry : awayEntry;
  const opponentEntry = isHomePlayer ? awayEntry : homeEntry;

  return {
    match: {
      id: match.id,
      tournamentId: match.tournamentId,
      matchDate: match.matchDate,
      matchTime: match.matchTime,
      matchStatus: match.matchStatus,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      resultSubmittedAt: match.resultSubmittedAt,
      bestOfFrames: match.bestOfFrames ?? match.stageRound.bestOfFrames,
      tournamentName: match.tournament.tournamentName,
      venueLabel: match.venue?.venueName ?? "Venue TBC",
      roundName: match.stageRound.roundName,
    },
    homeEntry,
    awayEntry,
    currentEntry,
    opponentEntry,
  } satisfies PlayerMatchAccessContext;
}

export function getEntryPrimaryEmail(entry: MatchEntrySummary) {
  return entry.members.find((member) => member.email)?.email ?? null;
}

export function getEntryEmailRecipients(entry: MatchEntrySummary) {
  return Array.from(new Set(entry.members.map((member) => member.email).filter((value): value is string => Boolean(value))));
}

export function getEntryParticipantNames(entry: MatchEntrySummary) {
  return entry.members.map((member) => member.playerName);
}