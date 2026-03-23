"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiMapPin, FiTrendingUp } from "react-icons/fi";

type TournamentSummary = {
  id: string;
  tournamentName: string;
  status: string;
  seasonName: string | null;
  venueName: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
};

type StandingRow = {
  rank: number;
  teamName: string;
  played: number;
  won: number;
  tied: number;
  lost: number;
  framesFor: number;
  framesAgainst: number;
  diff: number;
  points: number;
  recentForm?: string;
};

type StandingsGroup = {
  standingsDesc: string;
  count: number;
  rows: StandingRow[];
};

type StandingsResponse = {
  fixtureGroupIdentifier: string;
  groupCount: number;
  groups: StandingsGroup[];
};

type TournamentRankingRow = {
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

type TournamentRankingsResponse = {
  players: TournamentRankingRow[];
};

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

function formatTournamentStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getPlayerInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function MyTournamentsClient({
  tournaments,
}: {
  tournaments: TournamentSummary[];
}) {
  const [activeView, setActiveView] = useState<"groups" | "rankings">("groups");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(tournaments[0]?.id ?? null);
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<TournamentRankingRow[]>([]);
  const [isRankingsLoading, setIsRankingsLoading] = useState(false);
  const [rankingsError, setRankingsError] = useState<string | null>(null);

  const selectedTournament = useMemo(
    () => tournaments.find((tournament) => tournament.id === selectedTournamentId) ?? tournaments[0] ?? null,
    [selectedTournamentId, tournaments]
  );

  useEffect(() => {
    if (!selectedTournament?.id) {
      setStandings(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadStandings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/public/standings?fixtureGroupIdentifier=${encodeURIComponent(selectedTournament.id)}`,
          { cache: "no-store" }
        );

        const payload = (await response.json().catch(() => null)) as StandingsResponse | { error?: string } | null;

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload ? payload.error ?? "Failed to load standings." : "Failed to load standings."
          );
        }

        if (!isCancelled) {
          setStandings(payload as StandingsResponse);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setStandings(null);
          setError(loadError instanceof Error ? loadError.message : "Failed to load standings.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStandings();

    return () => {
      isCancelled = true;
    };
  }, [selectedTournament?.id]);

  useEffect(() => {
    if (!selectedTournament?.id) {
      setRankings([]);
      setRankingsError(null);
      setIsRankingsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadRankings = async () => {
      try {
        setIsRankingsLoading(true);
        setRankingsError(null);

        const response = await fetch(
          `/api/public/player-rankings?tournamentId=${encodeURIComponent(selectedTournament.id)}`,
          { cache: "no-store" }
        );

        const payload = (await response.json().catch(() => null)) as TournamentRankingsResponse | { error?: string } | null;

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload ? payload.error ?? "Failed to load rankings." : "Failed to load rankings."
          );
        }

        if (!isCancelled) {
          setRankings(Array.isArray((payload as TournamentRankingsResponse).players) ? (payload as TournamentRankingsResponse).players : []);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setRankings([]);
          setRankingsError(loadError instanceof Error ? loadError.message : "Failed to load rankings.");
        }
      } finally {
        if (!isCancelled) {
          setIsRankingsLoading(false);
        }
      }
    };

    void loadRankings();

    return () => {
      isCancelled = true;
    };
  }, [selectedTournament?.id]);

  if (tournaments.length === 0) {
    return (
      <div className="my-tournaments-empty-state">
        <p className="login-form-status login-form-status-info">
          You are not registered in any tournaments yet.
        </p>
      </div>
    );
  }

  return (
    <div className="my-tournaments-layout">
      <section className="my-tournaments-selector-panel">
        <div className="my-tournaments-sidebar-header">
          <h2 className="admin-dashboard-panel-title">Registered tournaments</h2>
          <p className="admin-dashboard-panel-subtitle">Choose a tournament to view only its standings.</p>
        </div>

        <div className="my-tournaments-list" role="list">
          {tournaments.map((tournament) => {
            const isActive = tournament.id === selectedTournament?.id;

            return (
              <button
                key={tournament.id}
                type="button"
                className={`my-tournament-button${isActive ? " is-active" : ""}`}
                onClick={() => setSelectedTournamentId(tournament.id)}
              >
                <div className="my-tournament-button-topline">
                  <strong>{tournament.tournamentName}</strong>
                  <span className="my-tournament-status-pill">{formatTournamentStatus(tournament.status)}</span>
                </div>
                <p className="my-tournament-button-meta">
                  <span>{tournament.seasonName ?? "Season TBD"}</span>
                  {tournament.venueName ? <span>{tournament.venueName}</span> : null}
                </p>
                <p className="my-tournament-button-meta">
                  <span>{formatDate(tournament.startDate)}</span>
                  {tournament.endDate ? <span>to {formatDate(tournament.endDate)}</span> : null}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="my-tournaments-main-panel">
        {selectedTournament ? (
          <>
            <header className="standings-header my-tournaments-header">
              <div>
                <h2 className="standings-title">{selectedTournament.tournamentName}</h2>
                <div className="my-tournaments-meta-row">
                  <span className="my-tournaments-meta-chip">
                    <FiTrendingUp aria-hidden="true" />
                    {formatTournamentStatus(selectedTournament.status)}
                  </span>
                  <span className="my-tournaments-meta-chip">
                    <FiCalendar aria-hidden="true" />
                    {formatDate(selectedTournament.startDate)}
                  </span>
                  {selectedTournament.venueName ? (
                    <span className="my-tournaments-meta-chip">
                      <FiMapPin aria-hidden="true" />
                      {selectedTournament.venueName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="standings-meta">
                {error
                  ? `Failed to load standings: ${error}`
                  : isLoading
                    ? "Loading standings..."
                    : standings
                      ? `${standings.groups.reduce((total, group) => total + group.rows.length, 0)} players`
                      : ""}
              </div>
            </header>

            {selectedTournament.registrationDeadline ? (
              <p className="my-tournaments-deadline">
                Registration deadline: {formatDate(selectedTournament.registrationDeadline)}
              </p>
            ) : null}

            <div className="my-tournaments-view-toggle" role="tablist" aria-label="Tournament data views">
              <button
                type="button"
                className={`my-tournaments-view-pill${activeView === "groups" ? " is-active" : ""}`}
                onClick={() => setActiveView("groups")}
                role="tab"
                aria-selected={activeView === "groups"}
              >
                Groups
              </button>
              <button
                type="button"
                className={`my-tournaments-view-pill${activeView === "rankings" ? " is-active" : ""}`}
                onClick={() => setActiveView("rankings")}
                role="tab"
                aria-selected={activeView === "rankings"}
              >
                Rankings
              </button>
            </div>

            {activeView === "groups" && !isLoading && !error && standings && standings.groups.length === 0 ? (
              <div className="my-tournaments-empty-state">
                <p className="login-form-status login-form-status-info">
                  No group standings are available for this tournament yet.
                </p>
              </div>
            ) : null}

            {activeView === "groups" && !error && standings && standings.groups.length > 0 ? (
              <div className="my-tournaments-standings-stack">
                {standings.groups.map((group) => (
                  <div className="standings-block" key={group.standingsDesc}>
                    <div className="standings-block-title">{group.standingsDesc}</div>

                    <div className="standings-table-wrap">
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th className="col-rank">#</th>
                            <th className="col-team">Player</th>
                            <th className="col-num">P</th>
                            <th className="col-num">W</th>
                            <th className="col-num">L</th>
                            <th className="col-num">+/-</th>
                            <th className="col-pts">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => (
                            <tr key={`${group.standingsDesc}-${row.rank}-${row.teamName}`}>
                              <td className="col-rank">{row.rank}</td>
                              <td className="col-team">
                                <div className="player-cell" title={row.teamName}>
                                  {row.teamName}
                                </div>
                              </td>
                              <td className="col-num">{row.played}</td>
                              <td className="col-num">{row.won}</td>
                              <td className="col-num">{row.lost}</td>
                              <td className="col-num">{row.diff}</td>
                              <td className="col-pts">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {activeView === "rankings" ? (
              <div className="my-tournaments-rankings-panel">
                {rankingsError ? (
                  <div className="my-tournaments-empty-state">
                    <p className="login-form-status login-form-status-error">
                      Failed to load rankings: {rankingsError}
                    </p>
                  </div>
                ) : isRankingsLoading ? (
                  <div className="my-tournaments-empty-state">
                    <p className="login-form-status login-form-status-info">Loading rankings...</p>
                  </div>
                ) : rankings.length === 0 ? (
                  <div className="my-tournaments-empty-state">
                    <p className="login-form-status login-form-status-info">
                      No rankings are available for this tournament yet.
                    </p>
                  </div>
                ) : (
                  <div className="my-tournaments-rankings-table-wrap">
                    <div className="my-tournaments-rankings-table-viewport">
                      <table className="my-tournaments-rankings-table">
                        <thead>
                          <tr>
                            <th>RK</th>
                            <th>PLYR</th>
                            <th>MP</th>
                            <th>PTS</th>
                            <th>W</th>
                            <th>L</th>
                            <th>FW</th>
                            <th>FL</th>
                            <th>FD</th>
                            <th>HB</th>
                            <th>HBC</th>
                            <th>ELO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((player, index) => (
                            <tr
                              key={player.id}
                              className={index % 2 === 0 ? "my-tournaments-rankings-row" : "my-tournaments-rankings-row my-tournaments-rankings-row-alt"}
                            >
                              <td>{index + 1}</td>
                              <td>
                                <div className="my-tournaments-rankings-player-cell">
                                  <div className="my-tournaments-rankings-player-fallback" aria-hidden="true">
                                    {getPlayerInitial(player.fullName)}
                                  </div>
                                  <span className="my-tournaments-rankings-player-name">{player.fullName}</span>
                                </div>
                              </td>
                              <td>{player.matchesPlayed}</td>
                              <td>{player.points}</td>
                              <td>{player.matchesWon}</td>
                              <td>{player.matchesLost}</td>
                              <td>{player.framesWon}</td>
                              <td>{player.framesLost}</td>
                              <td>{player.frameDifferential}</td>
                              <td>{player.highBreak}</td>
                              <td>{player.highBreakCumulative}</td>
                              <td>{player.eloRating ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}