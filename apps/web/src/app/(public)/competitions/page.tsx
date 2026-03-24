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

export default async function CompetitionsPage() {
  try {
    // Fetch active league with its active season and published tournaments
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
          take: 1, // Get the most recent active season
        },
      },
    });

    if (!league || !league.Season || league.Season.length === 0) {
      return (
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Competitions</h1>
          </div>
          <div className={styles.emptyState}>
            <p>No active competitions at the moment.</p>
          </div>
        </div>
      );
    }

    const season = league.Season[0];
    const tournaments = season.tournaments;

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Competitions</h1>
          <div className={styles.leagueInfo}>
            {league.logoUrl && (
              <img src={league.logoUrl} alt={league.leagueName} className={styles.logo} />
            )}
            <div className={styles.leagueDetails}>
              <p className={styles.leagueName}>{league.leagueName}</p>
              <p className={styles.seasonName}>{season.seasonName}</p>
            </div>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No competitions scheduled for this season yet.</p>
          </div>
        ) : (
          <div className={styles.competitionsGrid}>
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments?id=${tournament.id}`}
                className={styles.competitionCard}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{tournament.tournamentName}</h3>
                  <span className={styles.participantBadge}>
                    {tournament.participantType}
                  </span>
                </div>

                {tournament.description && (
                  <p className={styles.cardDescription}>{tournament.description}</p>
                )}

                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Status</span>
                    <span className={`${styles.metaValue} ${styles[`status-${tournament.status.toLowerCase()}`]}`}>
                      {tournament.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {tournament.startDate && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Starts</span>
                      <span className={styles.metaValue}>
                        <LocalTimeText value={tournament.startDate.toISOString()} options={{ year: "numeric", month: "numeric", day: "numeric" }} />
                      </span>
                    </div>
                  )}

                  {tournament.endDate && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Ends</span>
                      <span className={styles.metaValue}>
                        <LocalTimeText value={tournament.endDate.toISOString()} options={{ year: "numeric", month: "numeric", day: "numeric" }} />
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.viewButton}>View Competition →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Competitions</h1>
        </div>
        <div className={styles.emptyState}>
          <p>Unable to load competitions. Please try again later.</p>
        </div>
      </div>
    );
  }
}
