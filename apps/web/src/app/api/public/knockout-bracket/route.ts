import { NextResponse } from "next/server";
import { normalizeCountryCode } from "@/lib/country";
import { prisma } from "@/lib/prisma";
import type { BracketMatch, BracketPlayer, BracketRound } from "@/components/tournament-bracket/types";

type PlayerLike = {
  id: string;
  firstName: string;
  middleInitial?: string | null;
  lastName: string;
  country?: string | null;
};

type EntryMemberLike = {
  player: PlayerLike;
};

type EntryLike = {
  id: string;
  entryName: string | null;
  members: EntryMemberLike[];
};

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

function nextPowerOfTwo(value: number) {
  let current = 1;
  while (current < value) current *= 2;
  return current;
}

function deriveRoundLabel(roundSize: number) {
  if (roundSize <= 2) return "Final";
  if (roundSize === 4) return "Semifinals";
  if (roundSize === 8) return "Quarterfinals";
  return `Round of ${roundSize}`;
}

function emptyEntrant() {
  return null;
}

function toIsoDateTime(date: Date | null, matchTime?: string | null) {
  if (!date) return undefined;

  const nextDate = new Date(date);

  if (matchTime && /^\d{1,2}:\d{2}$/.test(matchTime.trim())) {
    const [hours, minutes] = matchTime.trim().split(":");
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);
  }

  return nextDate.toISOString();
}

function buildBracketPlayer(
  entry: EntryLike | null | undefined,
  score: number | null,
  opponentScore: number | null,
  fallbackId: string
): BracketPlayer | null {
  if (!entry) {
    return null;
  }

  const name = getEntryDisplayName(entry);
  const flagCode = getEntryCountryCode(entry) || undefined;
  const isWinner =
    typeof score === "number" && typeof opponentScore === "number" ? score > opponentScore : false;

  return {
    id: entry.id || fallbackId,
    name,
    flagCode,
    score,
    isWinner,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fixtureGroupIdentifier = searchParams.get("fixtureGroupIdentifier");

    if (!fixtureGroupIdentifier) {
      return NextResponse.json(
        { error: "Missing fixtureGroupIdentifier query param" },
        { status: 400 }
      );
    }

    const [groupRoundsRaw, knockoutRoundsRaw] = await Promise.all([
      prisma.stageRound.findMany({
        where: {
          roundType: "GROUP",
          tournamentStage: {
            tournamentId: fixtureGroupIdentifier,
          },
        },
        select: {
          id: true,
          roundName: true,
          sequence: true,
          groupCount: true,
          advancePerGroup: true,
          tournamentStage: {
            select: {
              sequence: true,
            },
          },
        },
      }),
      prisma.stageRound.findMany({
        where: {
          roundType: "KNOCKOUT",
          tournamentStage: {
            tournamentId: fixtureGroupIdentifier,
          },
        },
        select: {
          id: true,
          roundName: true,
          sequence: true,
          tournamentStage: {
            select: {
              sequence: true,
            },
          },
        },
      }),
    ]);

    const sortRoundMeta = (
      a: { sequence: number; tournamentStage: { sequence: number } },
      b: { sequence: number; tournamentStage: { sequence: number } }
    ) => {
      if (a.tournamentStage.sequence !== b.tournamentStage.sequence) {
        return a.tournamentStage.sequence - b.tournamentStage.sequence;
      }

      return a.sequence - b.sequence;
    };

    const groupRounds = [...groupRoundsRaw].sort(sortRoundMeta);
    const knockoutRounds = [...knockoutRoundsRaw].sort(sortRoundMeta);

    const latestGroupRound = [...groupRounds]
      .reverse()
      .find((round) => round.groupCount && round.advancePerGroup);

    if (!latestGroupRound) {
      return NextResponse.json({
        fixtureGroupIdentifier,
        entrantsCount: 0,
        bracketSize: 0,
        sourceRoundName: "",
        rounds: [],
      });
    }

    const advancingPerGroup = latestGroupRound.advancePerGroup ?? 0;
    const actualGroupCount = await prisma.tournamentGroup.count({
      where: {
        stageRoundId: latestGroupRound.id,
      },
    });
    const entrantsCount =
      (latestGroupRound.groupCount ?? actualGroupCount) * advancingPerGroup;

    if (entrantsCount < 2) {
      return NextResponse.json({
        fixtureGroupIdentifier,
        entrantsCount,
        bracketSize: 0,
        sourceRoundName: latestGroupRound.roundName,
        rounds: [],
      });
    }

    const bracketSize = nextPowerOfTwo(entrantsCount);
    const seededEntries = Array.from({ length: bracketSize }, () => emptyEntrant());

    const knockoutMatchesRaw = await prisma.match.findMany({
      where: {
        tournamentId: fixtureGroupIdentifier,
        stageRound: {
          roundType: "KNOCKOUT",
        },
      },
      select: {
        id: true,
        matchDate: true,
        matchTime: true,
        homeScore: true,
        awayScore: true,
        createdAt: true,
        stageRound: {
          select: {
            id: true,
            roundName: true,
            sequence: true,
            tournamentStage: {
              select: {
                sequence: true,
              },
            },
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
              include: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    middleInitial: true,
                    lastName: true,
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
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const knockoutMatches = [...knockoutMatchesRaw].sort((a, b) => {
      if (a.stageRound.tournamentStage.sequence !== b.stageRound.tournamentStage.sequence) {
        return a.stageRound.tournamentStage.sequence - b.stageRound.tournamentStage.sequence;
      }

      if (a.stageRound.sequence !== b.stageRound.sequence) {
        return a.stageRound.sequence - b.stageRound.sequence;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const displayRoundCount = Math.max(
      Math.log2(bracketSize),
      knockoutRounds.length || 0
    );

    const rounds = Array.from({ length: displayRoundCount }, (_, index) => {
      const roundMeta = knockoutRounds[index] ?? null;
      const entrantsInRound = bracketSize / 2 ** index;
      const slotCount = Math.max(1, entrantsInRound / 2);
      const roundMatches = roundMeta
        ? knockoutMatches.filter((match) => match.stageRound.id === roundMeta.id)
        : [];

      const seededSlots =
        index === 0
          ? Array.from({ length: slotCount }, (_, slotIndex) => ({
              top: seededEntries[slotIndex * 2] ?? emptyEntrant(),
              bottom: seededEntries[slotIndex * 2 + 1] ?? emptyEntrant(),
            }))
          : [];

      const matches: BracketMatch[] = Array.from({ length: slotCount }, (_, slotIndex) => {
        const match = roundMatches[slotIndex];

        if (match) {
          return {
            id: match.id,
            matchNumber: slotIndex + 1,
            scheduledAt: toIsoDateTime(match.matchDate, match.matchTime),
            player1: buildBracketPlayer(
              match.homeEntry,
              match.homeScore,
              match.awayScore,
              `${match.id}-player1`
            ),
            player2: buildBracketPlayer(
              match.awayEntry,
              match.awayScore,
              match.homeScore,
              `${match.id}-player2`
            ),
          };
        }

        if (index === 0) {
          return {
            id: `${roundMeta?.id ?? `round-${index}`}-match-${slotIndex + 1}`,
            matchNumber: slotIndex + 1,
            player1: seededSlots[slotIndex]?.top ?? emptyEntrant(),
            player2: seededSlots[slotIndex]?.bottom ?? emptyEntrant(),
          };
        }

        return {
          id: `${roundMeta?.id ?? `round-${index}`}-match-${slotIndex + 1}`,
          matchNumber: slotIndex + 1,
          player1: emptyEntrant(),
          player2: emptyEntrant(),
        };
      });

      return {
        id: roundMeta?.id ?? `knockout-round-${index + 1}`,
        name: roundMeta?.roundName || deriveRoundLabel(entrantsInRound),
        matches,
      } satisfies BracketRound;
    });

    return NextResponse.json({
      fixtureGroupIdentifier,
      entrantsCount,
      bracketSize,
      sourceRoundName: latestGroupRound.roundName,
      rounds,
    });
  } catch (error) {
    console.error("Failed to load public knockout bracket", error);

    return NextResponse.json(
      {
        error: "Failed to load public knockout bracket",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}