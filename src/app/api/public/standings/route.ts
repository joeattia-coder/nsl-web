import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PlayerLike = {
  firstName: string;
  lastName: string;
};

type EntryMemberLike = {
  player: PlayerLike;
};

type EntryLike = {
  id: string;
  entryName: string | null;
  members: EntryMemberLike[];
};

type StandingAccumulator = {
  teamName: string;
  played: number;
  won: number;
  tied: number;
  lost: number;
  framesFor: number;
  framesAgainst: number;
  diff: number;
  points: number;
};

function getEntryDisplayName(entry: EntryLike | null | undefined) {
  if (!entry) return "TBD";

  if (entry.entryName?.trim()) return entry.entryName.trim();

  const names = entry.members
    .map((member) => {
      const first = member.player.firstName?.trim() ?? "";
      const last = member.player.lastName?.trim() ?? "";
      return `${first} ${last}`.trim();
    })
    .filter(Boolean);

  if (names.length === 0) return "TBD";
  if (names.length === 1) return names[0];

  return names.join(" / ");
}

function sortRows(a: StandingAccumulator, b: StandingAccumulator) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.diff !== a.diff) return b.diff - a.diff;
  if (b.framesFor !== a.framesFor) return b.framesFor - a.framesFor;
  return a.teamName.localeCompare(b.teamName);
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

    const groups = await prisma.tournamentGroup.findMany({
      where: {
        stageRound: {
          tournamentStage: {
            tournamentId: fixtureGroupIdentifier,
          },
        },
      },
      include: {
        matches: {
          include: {
            homeEntry: {
              select: {
                id: true,
                entryName: true,
                members: {
                  include: {
                    player: {
                      select: {
                        firstName: true,
                        lastName: true,
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
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        sequence: "asc",
      },
    });

    const resultGroups = groups.map((group) => {
      const standingsMap = new Map<string, StandingAccumulator>();

      for (const match of group.matches) {
        const hasScore =
          match.homeScore !== null &&
          match.homeScore !== undefined &&
          match.awayScore !== null &&
          match.awayScore !== undefined;

        const isCompleted = match.matchStatus === "COMPLETED" || hasScore;
        if (!isCompleted) continue;

        const homeKey = match.homeEntryId;
        const awayKey = match.awayEntryId;

        if (!standingsMap.has(homeKey)) {
          standingsMap.set(homeKey, {
            teamName: getEntryDisplayName(match.homeEntry),
            played: 0,
            won: 0,
            tied: 0,
            lost: 0,
            framesFor: 0,
            framesAgainst: 0,
            diff: 0,
            points: 0,
          });
        }

        if (!standingsMap.has(awayKey)) {
          standingsMap.set(awayKey, {
            teamName: getEntryDisplayName(match.awayEntry),
            played: 0,
            won: 0,
            tied: 0,
            lost: 0,
            framesFor: 0,
            framesAgainst: 0,
            diff: 0,
            points: 0,
          });
        }

        const home = standingsMap.get(homeKey)!;
        const away = standingsMap.get(awayKey)!;

        const homeScore = match.homeScore ?? 0;
        const awayScore = match.awayScore ?? 0;

        home.played += 1;
        away.played += 1;

        home.framesFor += homeScore;
        home.framesAgainst += awayScore;
        away.framesFor += awayScore;
        away.framesAgainst += homeScore;

        if (homeScore > awayScore) {
          home.won += 1;
          away.lost += 1;
          home.points += 1;
        } else if (awayScore > homeScore) {
          away.won += 1;
          home.lost += 1;
          away.points += 1;
        } else {
          home.tied += 1;
          away.tied += 1;
        }

        home.diff = home.framesFor - home.framesAgainst;
        away.diff = away.framesFor - away.framesAgainst;
      }

      const rows = Array.from(standingsMap.values())
        .sort(sortRows)
        .map((row, index) => ({
          rank: index + 1,
          teamName: row.teamName,
          played: row.played,
          won: row.won,
          tied: row.tied,
          lost: row.lost,
          framesFor: row.framesFor,
          framesAgainst: row.framesAgainst,
          diff: row.diff,
          points: row.points,
          recentForm: "",
        }));

      return {
        standingsDesc: group.groupName,
        count: rows.length,
        rows,
      };
    });

    return NextResponse.json({
      fixtureGroupIdentifier,
      groupCount: resultGroups.length,
      groups: resultGroups,
    });
  } catch (error) {
    console.error("Failed to load public standings", error);

    return NextResponse.json(
      { error: "Failed to load public standings" },
      { status: 500 }
    );
  }
}