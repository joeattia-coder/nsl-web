import { NextResponse } from "next/server";
import { normalizeCountryCode } from "@/lib/country";
import { prisma } from "@/lib/prisma";

type PlayerLike = {
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
  return {
    name: "TBD",
    countryCode: "",
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
      include: {
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

      const slots = Array.from({ length: slotCount }, (_, slotIndex) => {
        const match = roundMatches[slotIndex];

        if (match) {
          return {
            id: `${roundMeta?.id ?? `round-${index}`}-slot-${slotIndex + 1}`,
            matchId: match.id,
            top: {
              name: getEntryDisplayName(match.homeEntry),
              countryCode: getEntryCountryCode(match.homeEntry),
            },
            bottom: {
              name: getEntryDisplayName(match.awayEntry),
              countryCode: getEntryCountryCode(match.awayEntry),
            },
          };
        }

        if (index === 0) {
          return {
            id: `${roundMeta?.id ?? `round-${index}`}-slot-${slotIndex + 1}`,
            matchId: null,
            top: seededSlots[slotIndex]?.top ?? emptyEntrant(),
            bottom: seededSlots[slotIndex]?.bottom ?? emptyEntrant(),
          };
        }

        return {
          id: `${roundMeta?.id ?? `round-${index}`}-slot-${slotIndex + 1}`,
          matchId: null,
          top: emptyEntrant(),
          bottom: emptyEntrant(),
        };
      });

      return {
        id: roundMeta?.id ?? `knockout-round-${index + 1}`,
        label: roundMeta?.roundName || deriveRoundLabel(entrantsInRound),
        slots,
      };
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