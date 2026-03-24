import Image from "next/image";
import { notFound } from "next/navigation";
import { FiAward, FiBarChart2, FiTarget, FiTrendingUp } from "react-icons/fi";
import LocalTimeText from "@/components/LocalTimeText";
import { getFlagCdnUrl } from "@/lib/country";
import { getPlayerDashboardData } from "@/lib/player-performance";
import PublicPlayerBackButton from "./PublicPlayerBackButton";
import styles from "./page.module.css";

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPercent(value: number) {
  return `${value}%`;
}

function renderPlayerPortrait(photoUrl: string | null, fullName: string) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={fullName}
        width={320}
        height={400}
        className={styles.portraitImage}
        priority
      />
    );
  }

  return (
    <Image
      src="/images/player_silhouette.svg"
      alt=""
      width={320}
      height={400}
      className={styles.portraitImage}
      priority
    />
  );
}

export default async function PublicPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dashboard = await getPlayerDashboardData(id);

  if (!dashboard || !dashboard.stats) {
    notFound();
  }

  return (
    <section className="admin-page login-page-shell player-dashboard-page">
      <div className="login-page-card player-portal-shell player-dashboard-card">
        <div className={`player-dashboard-hero player-portal-header ${styles.hero}`.trim()}>
          <div className={`player-dashboard-identity ${styles.identity}`.trim()}>
            <div className={styles.portraitFrame}>
              <div className={styles.portraitShell}>
                {renderPlayerPortrait(dashboard.player.photoUrl, dashboard.player.fullName)}
              </div>
            </div>
            <div className={`login-page-copy player-portal-copy ${styles.copy}`.trim()}>
              <p className="login-page-kicker">Player Stats</p>
              <div className={styles.titleRow}>
                <h1 className="login-page-title">{dashboard.player.fullName}</h1>
                {dashboard.player.country ? (
                  <Image
                    src={getFlagCdnUrl(dashboard.player.country, "w80") ?? ""}
                    alt={dashboard.player.country}
                    width={36}
                    height={24}
                    className={styles.playerFlag}
                  />
                ) : null}
              </div>
              <p className="login-page-subtitle">
                Public performance profile with current ranking, Elo movement, match output, frame differential, and recorded high breaks.
              </p>
            </div>
          </div>

          <div className={`player-dashboard-actions player-portal-actions ${styles.actions}`.trim()}>
            <PublicPlayerBackButton className={`player-subnav-tab ${styles.backButton}`.trim()} fallbackHref="/rankings" />
          </div>
        </div>

        <div className="player-portal-content player-portal-content-wide">
          <div className="player-dashboard-metric-grid">
            <article className="admin-dashboard-metric-card admin-dashboard-metric-accent-leagues">
              <div className="admin-dashboard-metric-header">
                <p className="admin-dashboard-metric-label">Ranking</p>
                <span className="admin-dashboard-metric-icon" aria-hidden="true">
                  <FiBarChart2 />
                </span>
              </div>
              <p className="admin-dashboard-metric-value">#{dashboard.rankingPosition ?? "-"}</p>
              <p className="admin-dashboard-metric-hint">Ordered by points, frame differential, and Elo.</p>
            </article>

            <article className="admin-dashboard-metric-card admin-dashboard-metric-accent-active">
              <div className="admin-dashboard-metric-header">
                <p className="admin-dashboard-metric-label">Elo Rating</p>
                <span className="admin-dashboard-metric-icon" aria-hidden="true">
                  <FiTrendingUp />
                </span>
              </div>
              <p className="admin-dashboard-metric-value">{dashboard.player.eloRating}</p>
              <p className="admin-dashboard-metric-hint">Live rating after the most recent completed match.</p>
            </article>

            <article className="admin-dashboard-metric-card admin-dashboard-metric-accent-published">
              <div className="admin-dashboard-metric-header">
                <p className="admin-dashboard-metric-label">Win Rate</p>
                <span className="admin-dashboard-metric-icon" aria-hidden="true">
                  <FiAward />
                </span>
              </div>
              <p className="admin-dashboard-metric-value">{formatPercent(dashboard.winPercentage)}</p>
              <p className="admin-dashboard-metric-hint">{dashboard.stats.matchesWon} wins from {dashboard.stats.matchesPlayed} completed matches.</p>
            </article>

            <article className="admin-dashboard-metric-card admin-dashboard-metric-accent-matches">
              <div className="admin-dashboard-metric-header">
                <p className="admin-dashboard-metric-label">High Break</p>
                <span className="admin-dashboard-metric-icon" aria-hidden="true">
                  <FiTarget />
                </span>
              </div>
              <p className="admin-dashboard-metric-value">{dashboard.stats.highBreak}</p>
              <p className="admin-dashboard-metric-hint">Cumulative high-break total: {dashboard.stats.highBreakCumulative}.</p>
            </article>
          </div>

          <div className="player-dashboard-grid">
            <section className="admin-dashboard-panel">
              <header className="admin-dashboard-panel-header">
                <h2 className="admin-dashboard-panel-title">Performance Snapshot</h2>
                <p className="admin-dashboard-panel-subtitle">Current league output across matches and frames.</p>
              </header>

              <dl className="player-dashboard-stat-list">
                <div><dt>Points</dt><dd>{dashboard.stats.points}</dd></div>
                <div><dt>Matches</dt><dd>{dashboard.stats.matchesPlayed}</dd></div>
                <div><dt>Frames Won</dt><dd>{dashboard.stats.framesWon}</dd></div>
                <div><dt>Frames Lost</dt><dd>{dashboard.stats.framesLost}</dd></div>
                <div><dt>Frame Differential</dt><dd>{formatSignedValue(dashboard.stats.frameDifferential)}</dd></div>
                <div><dt>Match Record</dt><dd>{dashboard.stats.matchesWon}-{dashboard.stats.matchesLost}</dd></div>
                <div><dt>Highest Break</dt><dd>{dashboard.stats.highBreak}</dd></div>
                <div><dt>Break Total</dt><dd>{dashboard.stats.highBreakCumulative}</dd></div>
              </dl>
            </section>

            <section className="admin-dashboard-panel">
              <header className="admin-dashboard-panel-header">
                <h2 className="admin-dashboard-panel-title">Recent Elo History</h2>
                <p className="admin-dashboard-panel-subtitle">Change after each completed match.</p>
              </header>

              {dashboard.eloHistory.length === 0 ? (
                <p className="admin-dashboard-panel-subtitle">No Elo history yet. Complete a match to generate the first rating movement.</p>
              ) : (
                <div className="player-dashboard-history-list">
                  {dashboard.eloHistory.map((entry) => (
                    <article key={entry.id} className="player-dashboard-history-item">
                      <div>
                        <p className="player-dashboard-history-title">{entry.tournamentName}</p>
                        <p className="player-dashboard-history-meta">
                          {entry.roundName} • <LocalTimeText value={entry.matchDate} fallback="TBC" options={{ weekday: "short", month: "short", day: "numeric", year: "numeric" }} />
                        </p>
                        <p className="player-dashboard-history-meta">
                          {entry.homeEntryName} {entry.homeScore ?? "-"}:{entry.awayScore ?? "-"} {entry.awayEntryName}
                        </p>
                      </div>

                      <div className="player-dashboard-history-rating">
                        <strong className={entry.ratingChange >= 0 ? "player-dashboard-rating-up" : "player-dashboard-rating-down"}>
                          {formatSignedValue(entry.ratingChange)}
                        </strong>
                        <span>{entry.ratingBefore} to {entry.ratingAfter}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}