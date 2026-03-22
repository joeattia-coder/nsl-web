import { redirect } from "next/navigation";
import { FiAward, FiBarChart2, FiTarget, FiTrendingUp } from "react-icons/fi";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { getPlayerDashboardData } from "@/lib/player-performance";
import PlayerPortalHeader from "../PlayerPortalHeader";

function formatDate(value: string | null) {
  if (!value) {
    return "TBC";
  }

  return new Date(value).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatPercent(value: number) {
  return `${value}%`;
}

export default async function PlayerDashboardPage() {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/dashboard");
  }

  if (!currentUser.linkedPlayerId) {
    return (
      <section className="admin-page login-page-shell player-dashboard-page">
        <div className="login-page-card">
          <div className="login-page-copy">
            <p className="login-page-kicker">Dashboard</p>
            <h1 className="login-page-title">No player profile linked</h1>
            <p className="login-page-subtitle">
              Your account is not linked to a player profile yet. Contact an administrator to complete account setup.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const dashboard = await getPlayerDashboardData(currentUser.linkedPlayerId);

  if (!dashboard || !dashboard.stats) {
    return (
      <section className="admin-page login-page-shell player-dashboard-page">
        <div className="login-page-card">
          <div className="login-page-copy">
            <p className="login-page-kicker">Dashboard</p>
            <h1 className="login-page-title">Dashboard unavailable</h1>
            <p className="login-page-subtitle">
              Your player dashboard could not be loaded. Try again shortly or contact an administrator.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page login-page-shell player-dashboard-page">
      <div className="login-page-card player-portal-shell player-dashboard-card">
        <PlayerPortalHeader
          kicker="Player Dashboard"
          title={dashboard.player.fullName}
          subtitle={`Signed in as ${currentUser.email ?? currentUser.username ?? "User"}. Current ladder position and Elo trend update from approved scores.`}
          avatarLabel={dashboard.player.fullName}
          avatarUrl={dashboard.player.photoUrl}
        />

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
            <p className="admin-dashboard-metric-hint">Sorted by points, frame differential, Elo, then alphabetical tie-break.</p>
          </article>

          <article className="admin-dashboard-metric-card admin-dashboard-metric-accent-active">
            <div className="admin-dashboard-metric-header">
              <p className="admin-dashboard-metric-label">Elo Rating</p>
              <span className="admin-dashboard-metric-icon" aria-hidden="true">
                <FiTrendingUp />
              </span>
            </div>
            <p className="admin-dashboard-metric-value">{dashboard.player.eloRating}</p>
            <p className="admin-dashboard-metric-hint">Latest live rating after the most recent completed match.</p>
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
              <div>
                <dt>Points</dt>
                <dd>{dashboard.stats.points}</dd>
              </div>
              <div>
                <dt>Matches</dt>
                <dd>{dashboard.stats.matchesPlayed}</dd>
              </div>
              <div>
                <dt>Frames Won</dt>
                <dd>{dashboard.stats.framesWon}</dd>
              </div>
              <div>
                <dt>Frames Lost</dt>
                <dd>{dashboard.stats.framesLost}</dd>
              </div>
              <div>
                <dt>Frame Differential</dt>
                <dd>{formatSignedValue(dashboard.stats.frameDifferential)}</dd>
              </div>
              <div>
                <dt>Match Record</dt>
                <dd>{dashboard.stats.matchesWon}-{dashboard.stats.matchesLost}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-dashboard-panel">
            <header className="admin-dashboard-panel-header">
              <h2 className="admin-dashboard-panel-title">Recent Elo History</h2>
              <p className="admin-dashboard-panel-subtitle">Change after each completed match.</p>
            </header>
            {dashboard.eloHistory.length === 0 ? (
              <p className="admin-dashboard-panel-subtitle">No Elo history yet. Complete a match to generate your first rating movement.</p>
            ) : (
              <div className="player-dashboard-history-list">
                {dashboard.eloHistory.map((entry) => (
                  <article key={entry.id} className="player-dashboard-history-item">
                    <div>
                      <p className="player-dashboard-history-title">{entry.tournamentName}</p>
                      <p className="player-dashboard-history-meta">{entry.roundName} • {formatDate(entry.matchDate)}</p>
                      <p className="player-dashboard-history-meta">
                        {entry.homeEntryName} {entry.homeScore ?? "-"}:{" "}
                        {entry.awayScore ?? "-"} {entry.awayEntryName}
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