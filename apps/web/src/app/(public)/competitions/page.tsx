import Link from "next/link";
import LocalTimeText from "@/components/LocalTimeText";
import { prisma } from "@/lib/prisma";
import styles from "./competitions.module.css";

export const metadata = {
  title: "Competitions",
  description: "Browse all competitions and tournaments",
};

interface Tournament {
  id: string;
  tournamentName: string;
  participantType: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  isPublished: boolean;
}

interface Season {
  seasonName: string;
  startDate: Date | null;
  endDate: Date | null;
  tournaments: Tournament[];
}

interface League {
  leagueName: string;
  logoUrl: string | null;
  Season: Season[];
}

type CompetitionsData = {
  league: League | null;
  season: Season | null;
  tournaments: Tournament[];
  loadError: boolean;
};

async function loadCompetitionsData(): Promise<CompetitionsData> {
  try {
    const league = await prisma.league.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        leagueName: true,
        logoUrl: true,
        Season: {
          where: { isActive: true },
          select: {
            id: true,
            seasonName: true,
            startDate: true,
            endDate: true,
            tournaments: {
              where: { isPublished: true },
              select: {
                id: true,
                tournamentName: true,
                participantType: true,
                description: true,
                startDate: true,
                endDate: true,
                status: true,
                isPublished: true,
              },
              orderBy: { startDate: "asc" },
            },
          },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
    });

    if (!league || league.Season.length === 0) {
      return {
        league: null,
        season: null,
        tournaments: [],
        loadError: false,
      };
    }

    const season = league.Season[0];

    return {
      league,
      season,
      tournaments: season.tournaments,
      loadError: false,
    };
  } catch (error) {
    console.error("Error fetching competitions:", error);

    return {
      league: null,
      season: null,
      tournaments: [],
      loadError: true,
    };
  }
}

export default async function CompetitionsPage() {
  const { season, tournaments, loadError } = await loadCompetitionsData();

  return (
    <main className={styles.container}>
      <section className={styles.pageSection}>
        <header className={styles.header}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>NSL Competitions</p>
            <h1 className={styles.title}>Competitions</h1>
            <p className={styles.intro}>
              Browse the active public competition slate, review the current season, and move directly into tournament pages from a cleaner league overview.
            </p>
          </div>
        </header>

        {loadError ? (
          <div className={styles.emptyState}>
            <h2>Unable to load competitions</h2>
            <p>Please try again later.</p>
          </div>
        ) : !season ? (
          <div className={styles.emptyState}>
            <h2>No active competitions yet</h2>
            <p>No active competitions are available at the moment.</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No competitions scheduled</h2>
            <p>No competitions are scheduled for this season yet.</p>
          </div>
        ) : (
          <section className={styles.directorySection}>
            <div className={styles.directoryHeader}>
              <div>
                <p className={styles.sectionLabel}>Schedule</p>
                <h2 className={styles.sectionTitle}>Published competitions for the current season.</h2>
              </div>
              <p className={styles.sectionMeta}>{tournaments.length} {tournaments.length === 1 ? "competition" : "competitions"}</p>
            </div>

            <div className={styles.competitionsGrid}>
              {tournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.id}`}
                  className={styles.competitionCard}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{tournament.tournamentName}</h3>
                    <span className={styles.participantBadge}>{tournament.participantType}</span>
                  </div>

                  <p className={styles.cardDescription}>
                    {tournament.description || "Open the competition page for the full format, schedule, and tournament detail."}
                  </p>

                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Status</span>
                      <span className={`${styles.metaValue} ${styles[`status-${tournament.status.toLowerCase()}`]}`}>
                        {tournament.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {tournament.startDate ? (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Starts</span>
                        <span className={styles.metaValue}>
                          <LocalTimeText value={tournament.startDate.toISOString()} options={{ year: "numeric", month: "short", day: "numeric" }} />
                        </span>
                      </div>
                    ) : null}

                    {tournament.endDate ? (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Ends</span>
                        <span className={styles.metaValue}>
                          <LocalTimeText value={tournament.endDate.toISOString()} options={{ year: "numeric", month: "short", day: "numeric" }} />
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.viewButton}>View Competition</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
