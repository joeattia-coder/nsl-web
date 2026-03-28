import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LocalTimeText from "@/components/LocalTimeText";
import { prisma } from "@/lib/prisma";
import TournamentDetailClient from "./TournamentDetailClient";
import styles from "./TournamentDetailPage.module.css";

type PageProps = {
  params: Promise<{ id: string }>;
};

type TournamentSummary = {
  id: string;
  tournamentName: string;
  description: string | null;
  participantType: string;
  snookerFormat: string | null;
  status: string;
  seasonName: string | null;
  venueName: string | null;
  venueLocation: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  entryCount: number;
  matchCount: number;
  groupCount: number;
};

function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "TBD";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

async function loadTournamentSummary(id: string): Promise<TournamentSummary | null> {
  const tournament = await prisma.tournament.findFirst({
    where: {
      id,
      isPublished: true,
    },
    select: {
      id: true,
      tournamentName: true,
      description: true,
      participantType: true,
      snookerFormat: true,
      status: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
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
          country: true,
        },
      },
      _count: {
        select: {
          entries: true,
          matches: true,
        },
      },
      stages: {
        select: {
          rounds: {
            select: {
              _count: {
                select: {
                  groups: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    return null;
  }

  const venueLocation = [tournament.venue?.city, tournament.venue?.stateProvince, tournament.venue?.country]
    .filter((segment): segment is string => typeof segment === "string" && segment.trim().length > 0)
    .join(", ");

  const groupCount = tournament.stages.reduce((stageTotal, stage) => {
    return (
      stageTotal +
      stage.rounds.reduce((roundTotal, round) => roundTotal + round._count.groups, 0)
    );
  }, 0);

  return {
    id: tournament.id,
    tournamentName: tournament.tournamentName,
    description: tournament.description?.trim() || null,
    participantType: tournament.participantType,
    snookerFormat: tournament.snookerFormat,
    status: tournament.status,
    seasonName: tournament.season.seasonName,
    venueName: tournament.venue?.venueName ?? null,
    venueLocation: venueLocation || null,
    startDate: tournament.startDate?.toISOString() ?? null,
    endDate: tournament.endDate?.toISOString() ?? null,
    registrationDeadline: tournament.registrationDeadline?.toISOString() ?? null,
    entryCount: tournament._count.entries,
    matchCount: tournament._count.matches,
    groupCount,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tournament = await loadTournamentSummary(id);

  if (!tournament) {
    return {
      title: "Tournament Not Found",
    };
  }

  return {
    title: `${tournament.tournamentName} | Tournaments`,
    description:
      tournament.description ||
      `Public groups, rankings, and match schedule for ${tournament.tournamentName}.`,
  };
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const tournament = await loadTournamentSummary(id);

  if (!tournament) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>NSL Tournament Centre</p>
            <div className={styles.titleRow}>
              <div className={styles.titleBlock}>
                <h1 className={styles.title}>{tournament.tournamentName}</h1>
                {tournament.description ? <p className={styles.description}>{tournament.description}</p> : null}
              </div>

              <div className={styles.venueBlock}>
                <p className={styles.venueLabel}>Venue</p>
                <p className={styles.venueValue}>{tournament.venueName ?? "Venue TBA"}</p>
                {tournament.venueLocation ? <p className={styles.venueMeta}>{tournament.venueLocation}</p> : null}
              </div>
            </div>
          </div>

          <div className={styles.metaRail}>
            <div className={styles.metaChip}>
              <span className={styles.metaChipLabel}>Season</span>
              <span className={styles.metaChipValue}>{tournament.seasonName ?? "Current season"}</span>
            </div>
            <div className={styles.metaChip}>
              <span className={styles.metaChipLabel}>Status</span>
              <span className={styles.metaChipValue}>{formatEnumLabel(tournament.status)}</span>
            </div>
            <div className={styles.metaChip}>
              <span className={styles.metaChipLabel}>Format</span>
              <span className={styles.metaChipValue}>{formatEnumLabel(tournament.snookerFormat)}</span>
            </div>
            <div className={styles.metaChip}>
              <span className={styles.metaChipLabel}>Participants</span>
              <span className={styles.metaChipValue}>{formatEnumLabel(tournament.participantType)}</span>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Entries</p>
              <p className={styles.statValue}>{tournament.entryCount}</p>
              <p className={styles.statHint}>Registered competitors in this published draw.</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Groups</p>
              <p className={styles.statValue}>{tournament.groupCount}</p>
              <p className={styles.statHint}>Round-robin blocks surfaced in the public standings view.</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Matches</p>
              <p className={styles.statValue}>{tournament.matchCount}</p>
              <p className={styles.statHint}>Published fixtures linked directly into the match centre.</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Window</p>
              <p className={styles.statValue}>
                {tournament.startDate ? (
                  <LocalTimeText
                    value={tournament.startDate}
                    options={{ month: "short", day: "numeric" }}
                  />
                ) : (
                  "TBA"
                )}
              </p>
              <p className={styles.statHint}>
                {tournament.endDate ? (
                  <>
                    Ends{" "}
                    <LocalTimeText
                      value={tournament.endDate}
                      options={{ month: "short", day: "numeric", year: "numeric" }}
                    />
                  </>
                ) : tournament.registrationDeadline ? (
                  <>
                    Registration closes{" "}
                    <LocalTimeText
                      value={tournament.registrationDeadline}
                      options={{ month: "short", day: "numeric", year: "numeric" }}
                    />
                  </>
                ) : (
                  "Schedule details will appear here when available."
                )}
              </p>
            </article>
          </div>
        </header>

        <TournamentDetailClient tournament={tournament} />
      </section>
    </main>
  );
}