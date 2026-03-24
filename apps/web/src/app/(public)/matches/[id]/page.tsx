import { notFound } from "next/navigation";
import HeadToHeadStats, { type HeadToHeadStatRow } from "@/components/HeadToHeadStats";
import LocalTimeText from "@/components/LocalTimeText";
import { normalizeCountryCode } from "@/lib/country";
import { getFlagCdnUrl } from "@/lib/country";
import { prisma } from "@/lib/prisma";
import { parseStoredMatchDateTime } from "@/lib/timezone";
import MatchCentreBackButton from "./MatchCentreBackButton";
import styles from "./MatchCentrePage.module.css";

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
  return values.reduce((total, value) => total + (typeof value === "number" ? value : 0), 0);
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

function buildStatsRows(match: {
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
}, leftPlayerIds: string[], rightPlayerIds: string[]): HeadToHeadStatRow[] {
  const leftPointTotal = sumNullable(match.frames.map((frame) => frame.homePoints));
  const rightPointTotal = sumNullable(match.frames.map((frame) => frame.awayPoints));
  const leftHighestBreak = Math.max(0, ...match.frames.map((frame) => frame.homeHighBreak ?? 0));
  const rightHighestBreak = Math.max(0, ...match.frames.map((frame) => frame.awayHighBreak ?? 0));

  const breaks = match.frames.flatMap((frame) => frame.breaks);
  const leftBreaks = breaks.filter((entry) => leftPlayerIds.includes(entry.playerId));
  const rightBreaks = breaks.filter((entry) => rightPlayerIds.includes(entry.playerId));

  return [
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

export default async function MatchCentrePage({
  context,
  params,
  searchParams,
}: {
  context?: never;
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string | string[] }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const id = resolvedParams.id;
  const requestedGroupId = typeof resolvedSearchParams.group === "string" ? resolvedSearchParams.group : "";

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
      matchStatus: true,
      scheduleStatus: true,
      homeScore: true,
      awayScore: true,
      publicNote: true,
      tournament: {
        select: {
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
    notFound();
  }

  const leftPlayerIds = getEntryPlayerIds(match.homeEntry.members);
  const rightPlayerIds = getEntryPlayerIds(match.awayEntry.members);

  const historicalMatches = await prisma.match.findMany({
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
  });

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
  const stats = buildStatsRows(match, leftPlayerIds, rightPlayerIds);
  const leftCountryCode = getEntryCountryCode(match.homeEntry);
  const rightCountryCode = getEntryCountryCode(match.awayEntry);
  const venueLabel = [match.tournament.venue?.venueName, match.tournament.venue?.city, match.tournament.venue?.stateProvince]
    .filter(Boolean)
    .join(", ");
  const backHref = requestedGroupId ? `/matches?group=${encodeURIComponent(requestedGroupId)}` : "/matches";

  return (
    <main className={`content ${styles.page}`}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>Match Centre</div>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.title}>{match.tournament.tournamentName}</h1>
              <p className={styles.subTitle}>{match.stageRound.roundName} • {match.tournament.season.seasonName}</p>
            </div>
            <MatchCentreBackButton className={styles.backButton} fallbackHref={backHref} />
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Scheduled</span>
              <span className={styles.metaValue}>
                <LocalTimeText
                  value={scheduledAt}
                  fallback="TBC"
                  options={{ weekday: "short", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }}
                />
              </span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Status</span>
              <span className={styles.metaValue}>{match.matchStatus.replaceAll("_", " ")}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Venue</span>
              <span className={styles.metaValue}>{venueLabel || "Venue TBC"}</span>
            </div>
          </div>
        </div>
      </section>

      <HeadToHeadStats
        leftPlayerName={leftName}
        rightPlayerName={rightName}
        leftPlayerHref={leftPlayerIds.length === 1 ? `/players/${leftPlayerIds[0]}` : undefined}
        rightPlayerHref={rightPlayerIds.length === 1 ? `/players/${rightPlayerIds[0]}` : undefined}
        leftPlayerPhoto={getEntryPhotoUrl(match.homeEntry)}
        rightPlayerPhoto={getEntryPhotoUrl(match.awayEntry)}
        leftPlayerFlagUrl={leftCountryCode ? getFlagCdnUrl(leftCountryCode, "w40") : null}
        leftPlayerFlagAlt={leftCountryCode}
        rightPlayerFlagUrl={rightCountryCode ? getFlagCdnUrl(rightCountryCode, "w40") : null}
        rightPlayerFlagAlt={rightCountryCode}
        leftScore={match.homeScore ?? 0}
        rightScore={match.awayScore ?? 0}
        headToHead={headToHead}
        stats={stats}
      />

      {match.publicNote ? (
        <section className={styles.notePanel}>
          <h2 className={styles.noteTitle}>Match Notes</h2>
          <p className={styles.noteBody}>{match.publicNote}</p>
        </section>
      ) : null}
    </main>
  );
}