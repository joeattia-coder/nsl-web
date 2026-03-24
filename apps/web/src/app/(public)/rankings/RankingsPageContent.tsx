"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiBarChart2, FiStar, FiTrendingUp } from "react-icons/fi";
import { getFlagCdnUrl } from "@/lib/country";
import styles from "../page.module.css";

type Player = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  matchesPlayed: number;
  points: number;
  matchesWon: number;
  matchesLost: number;
  framesWon: number;
  framesLost: number;
  frameDifferential: number;
  highBreak: number;
  highBreakCumulative: number;
  eloRating?: number;
  photoUrl?: string;
  country?: string;
};

function getFlagSrc(country: string | undefined) {
  return getFlagCdnUrl(country, "w40");
}

function compareAlphabetical(left: Player, right: Player) {
  const firstNameComparison = (left.firstName ?? "").localeCompare(right.firstName ?? "", undefined, {
    sensitivity: "base",
  });

  if (firstNameComparison !== 0) {
    return firstNameComparison;
  }

  return (left.lastName ?? "").localeCompare(right.lastName ?? "", undefined, {
    sensitivity: "base",
  });
}

function compareRanking(left: Player, right: Player) {
  const leftHasPlayed = left.matchesPlayed > 0;
  const rightHasPlayed = right.matchesPlayed > 0;

  if (leftHasPlayed !== rightHasPlayed) {
    return leftHasPlayed ? -1 : 1;
  }

  if (!leftHasPlayed && !rightHasPlayed) {
    return compareAlphabetical(left, right);
  }

  if (right.points !== left.points) {
    return right.points - left.points;
  }

  if (right.frameDifferential !== left.frameDifferential) {
    return right.frameDifferential - left.frameDifferential;
  }

  if ((right.eloRating ?? 0) !== (left.eloRating ?? 0)) {
    return (right.eloRating ?? 0) - (left.eloRating ?? 0);
  }

  return compareAlphabetical(left, right);
}

function renderHeaderLabel(abbreviation: string, label: string) {
  return (
    <span className={styles.rankingsHeaderTrigger} tabIndex={0} aria-label={label}>
      {abbreviation}
      <span role="tooltip" className={styles.rankingsHeaderTooltip}>
        {label}
      </span>
    </span>
  );
}

function renderPlayerCell(player: Player) {
  return (
    <div className={styles.rankingsPlayerCell}>
      {player.photoUrl ? (
        <Image
          src={player.photoUrl}
          alt={player.fullName}
          width={36}
          height={36}
          className={styles.rankingsPlayerPhoto}
        />
      ) : (
        <div className={styles.rankingsPlayerFallback}>
          {player.fullName?.[0] ?? "?"}
        </div>
      )}
      <Link href={`/players/${player.id}`} className={`${styles.rankingsPlayerName} public-player-link`}>
        {player.fullName}
      </Link>
    </div>
  );
}

function renderCountryCell(player: Player) {
  const flagSrc = getFlagSrc(player.country);

  if (!flagSrc) {
    return <span className={styles.rankingsCountryFallback}>—</span>;
  }

  return (
    <Image
      src={flagSrc}
      alt={player.country ?? "Country flag"}
      width={28}
      height={20}
      className={styles.rankingsCountryFlag}
      title={player.country}
    />
  );
}

export default function RankingsPageContent() {
  const [selectedView, setSelectedView] = useState<"ranking" | "elo" | "highbreak">("ranking");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rankingPlayers = [...players].sort(compareRanking);
  const rankingLeader = rankingPlayers[0];
  const eloPlayers = [...players].sort((a, b) => (b.eloRating ?? 0) - (a.eloRating ?? 0));
  const eloLeader = eloPlayers[0];
  const highBreakPlayers = [...players].sort((a, b) => b.highBreak - a.highBreak);
  const highBreakLeader = highBreakPlayers[0];

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("/api/public/player-rankings")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch rankings");
        const data = await res.json();
        setPlayers(Array.isArray(data.players) ? data.players : []);
      })
      .catch((err) => {
        setError(err.message || "Error loading rankings");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.rankingsPage}>
      <section className={styles.rankingsSection}>
        <header className={styles.rankingsHeader}>
          <h1 className={styles.rankingsTitle}>Player Rankings</h1>
          <p className={styles.rankingsIntro}>
            Switch between standings, ELO, and high breaks using the same card treatment as the admin dashboard.
          </p>
          <p className={styles.rankingsMeta}>
            ELO uses match result plus frame-share: 75% win/loss outcome and 25% share of frames won, with faster movement for newer players.
          </p>
        </header>

        <div className={styles.rankingsCards}>
          <div className={styles.rankingsCardRow}>
            <button
              type="button"
              className={`admin-dashboard-metric-card admin-dashboard-metric-link admin-dashboard-metric-accent-leagues ${selectedView === "ranking" ? styles.rankingsCardSelected : ""}`}
              tabIndex={0}
              onClick={() => setSelectedView("ranking")}
            >
              <div className="admin-dashboard-metric-header">
                <p className="admin-dashboard-metric-label">Ranking</p>
                <span className="admin-dashboard-metric-icon" aria-hidden="true">
                  <FiBarChart2 />
                </span>
              </div>
              <p className="admin-dashboard-metric-value">{players.length}</p>
              <p className="admin-dashboard-metric-hint">
                Players ranked by match points. Leader: {rankingLeader?.fullName ?? "N/A"}
              </p>
            </button>

            <button
              type="button"
              className={`admin-dashboard-metric-card admin-dashboard-metric-link admin-dashboard-metric-accent-active ${selectedView === "elo" ? styles.rankingsCardSelected : ""}`}
              tabIndex={0}
              onClick={() => setSelectedView("elo")}
            >
              <div className="admin-dashboard-metric-header">
                <p
                  className="admin-dashboard-metric-label"
                  title="ELO blends match result and frame-share. A dominant win gains slightly more than a narrow win."
                >
                  ELO Rating
                </p>
                <span className="admin-dashboard-metric-icon" aria-hidden="true">
                  <FiTrendingUp />
                </span>
              </div>
              <p className="admin-dashboard-metric-value">{eloLeader?.eloRating ?? 0}</p>
              <p className="admin-dashboard-metric-hint">Top live rating. Leader: {eloLeader?.fullName ?? "N/A"}</p>
            </button>

            <button
              type="button"
              className={`admin-dashboard-metric-card admin-dashboard-metric-link admin-dashboard-metric-accent-published ${selectedView === "highbreak" ? styles.rankingsCardSelected : ""}`}
              tabIndex={0}
              onClick={() => setSelectedView("highbreak")}
            >
              <div className="admin-dashboard-metric-header">
                <p className="admin-dashboard-metric-label">High Break</p>
                <span className="admin-dashboard-metric-icon" aria-hidden="true">
                  <FiStar />
                </span>
              </div>
              <p className="admin-dashboard-metric-value">{highBreakLeader?.highBreak ?? 0}</p>
              <p className="admin-dashboard-metric-hint">
                Best frame break recorded. Leader: {highBreakLeader?.fullName ?? "N/A"}
              </p>
            </button>
          </div>
        </div>

        <div className={styles.rankingsTableWrap}>
          {loading ? (
            <div className={styles.rankingsStatus}>Loading...</div>
          ) : error ? (
            <div className={`${styles.rankingsStatus} ${styles.rankingsStatusError}`}>{error}</div>
          ) : (
            <div className={styles.rankingsTableViewport}>
              <table className={styles.rankingsTable}>
                <thead>
                  {selectedView === "ranking" && (
                    <tr>
                      <th>{renderHeaderLabel("RK", "Rank")}</th>
                      <th>{renderHeaderLabel("PLYR", "Player")}</th>
                      <th>{renderHeaderLabel("MP", "Matches Played")}</th>
                      <th>{renderHeaderLabel("PTS", "Points")}</th>
                      <th>{renderHeaderLabel("W", "Matches Won")}</th>
                      <th>{renderHeaderLabel("L", "Matches Lost")}</th>
                      <th>{renderHeaderLabel("FW", "Frames Won")}</th>
                      <th>{renderHeaderLabel("FL", "Frames Lost")}</th>
                      <th>{renderHeaderLabel("FD", "Frame Differential")}</th>
                      <th>{renderHeaderLabel("HB", "High Break")}</th>
                      <th>{renderHeaderLabel("HBC", "High Break Cumulative")}</th>
                      <th>{renderHeaderLabel("CTRY", "Country")}</th>
                    </tr>
                  )}
                  {selectedView === "elo" && (
                    <tr>
                      <th>{renderHeaderLabel("RK", "Rank")}</th>
                      <th>{renderHeaderLabel("PLYR", "Player")}</th>
                      <th>{renderHeaderLabel("ELO", "ELO Rating")}</th>
                      <th>{renderHeaderLabel("CTRY", "Country")}</th>
                    </tr>
                  )}
                  {selectedView === "highbreak" && (
                    <tr>
                      <th>{renderHeaderLabel("RK", "Rank")}</th>
                      <th>{renderHeaderLabel("PLYR", "Player")}</th>
                      <th>{renderHeaderLabel("HB", "High Break")}</th>
                      <th>{renderHeaderLabel("CTRY", "Country")}</th>
                    </tr>
                  )}
                </thead>

                <tbody>
                  {selectedView === "ranking" &&
                    rankingPlayers.map((player, idx) => (
                      <tr key={player.id} className={idx % 2 === 0 ? styles.rankingsRow : `${styles.rankingsRow} ${styles.rankingsRowAlt}`}>
                        <td>{idx + 1}</td>
                        <td>{renderPlayerCell(player)}</td>
                        <td>{player.matchesPlayed}</td>
                        <td>{player.points}</td>
                        <td>{player.matchesWon}</td>
                        <td>{player.matchesLost}</td>
                        <td>{player.framesWon}</td>
                        <td>{player.framesLost}</td>
                        <td>{player.frameDifferential}</td>
                        <td>{player.highBreak}</td>
                        <td>{player.highBreakCumulative}</td>
                        <td>{renderCountryCell(player)}</td>
                      </tr>
                    ))}

                  {selectedView === "elo" &&
                    eloPlayers.map((player, idx) => (
                      <tr key={player.id} className={idx % 2 === 0 ? styles.rankingsRow : `${styles.rankingsRow} ${styles.rankingsRowAlt}`}>
                        <td>{idx + 1}</td>
                        <td>{renderPlayerCell(player)}</td>
                        <td>{player.eloRating ?? 0}</td>
                        <td>{renderCountryCell(player)}</td>
                      </tr>
                    ))}

                  {selectedView === "highbreak" &&
                    highBreakPlayers.map((player, idx) => (
                      <tr key={player.id} className={idx % 2 === 0 ? styles.rankingsRow : `${styles.rankingsRow} ${styles.rankingsRowAlt}`}>
                        <td>{idx + 1}</td>
                        <td>{renderPlayerCell(player)}</td>
                        <td>{player.highBreak}</td>
                        <td>{renderCountryCell(player)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
