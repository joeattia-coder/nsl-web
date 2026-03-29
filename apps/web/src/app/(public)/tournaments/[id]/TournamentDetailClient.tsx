"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFlagCdnUrl } from "@/lib/country";
import styles from "./TournamentDetailPage.module.css";

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

type StandingsRow = {
  rank: number;
  teamName: string;
  playerId?: string | null;
  played: number;
  won: number;
  tied?: number;
  lost: number;
  framesFor?: number;
  framesAgainst?: number;
  diff: number;
  points: number;
};

type StandingsGroup = {
  standingsDesc: string;
  count: number;
  rows: StandingsRow[];
};

type StandingsResponse = {
  groups?: StandingsGroup[];
};

type RankingPlayer = {
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

type RankingsResponse = {
  players?: RankingPlayer[];
};

type FixtureRow = {
  id: string;
  fixtureId: string;
  fixtureDateTime: string;
  fixtureTime: string;
  homeTeamName: string;
  roadTeamName: string;
  homePlayerId: string | null;
  roadPlayerId: string | null;
  homePlayerPhotoUrl: string | null;
  roadPlayerPhotoUrl: string | null;
  homeCountryCode: string;
  roadCountryCode: string;
  homeScore: number | null;
  roadScore: number | null;
  roundDesc: string;
  roundType: string;
  matchStatus: string;
  scheduleStatus: string;
};

type FixturesResponse = {
  fixtures?: FixtureRow[];
};

type AsyncState<T> = {
  hasLoaded: boolean;
  loading: boolean;
  error: string;
  data: T;
};

type TabId = "groups" | "rankings" | "matches";

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

function formatDateTimeLabel(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return {
      date: "TBA",
      time: "",
    };
  }

  return {
    date: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsed),
    time: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed),
  };
}

function comparePlayers(left: RankingPlayer, right: RankingPlayer) {
  const leftHasPlayed = left.matchesPlayed > 0;
  const rightHasPlayed = right.matchesPlayed > 0;

  if (leftHasPlayed !== rightHasPlayed) {
    return leftHasPlayed ? -1 : 1;
  }

  if (right.points !== left.points) {
    return right.points - left.points;
  }

  if (right.frameDifferential !== left.frameDifferential) {
    return right.frameDifferential - left.frameDifferential;
  }

  return left.fullName.localeCompare(right.fullName, undefined, {
    sensitivity: "base",
  });
}

function renderHeaderLabel(abbreviation: string, label: string) {
  return (
    <span className={styles.tableHeaderTrigger} tabIndex={0} aria-label={label}>
      {abbreviation}
      <span role="tooltip" className={styles.tableHeaderTooltip}>
        {label}
      </span>
    </span>
  );
}

function getStatusBadgeClassName(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "scheduled") {
    return `${styles.statusBadge} ${styles.statusBadgeScheduled}`;
  }

  if (normalized === "completed") {
    return `${styles.statusBadge} ${styles.statusBadgeCompleted}`;
  }

  return styles.statusBadge;
}

function PlayerCell({
  name,
  href,
  photoUrl,
  country,
}: {
  name: string;
  href: string | null;
  photoUrl?: string | null;
  country?: string | null;
}) {
  const flagSrc = getFlagCdnUrl(country ?? undefined, "w20");

  return (
    <div className={styles.playerCell}>
      <div className={styles.flagSlot}>
        {flagSrc ? (
          <Image src={flagSrc} alt={country ?? "Country flag"} width={28} height={20} className={styles.countryFlag} />
        ) : (
          <span className={styles.countryFallback}>-</span>
        )}
      </div>

      {photoUrl ? (
        <Image src={photoUrl} alt={name} width={36} height={36} className={styles.playerPhoto} />
      ) : (
        <div className={styles.playerFallback}>{name[0] ?? "?"}</div>
      )}

      <div className={styles.playerCopy}>
        {href ? (
          <Link href={href} className={`${styles.playerName} public-player-link`}>
            {name}
          </Link>
        ) : (
          <span className={styles.playerName}>{name}</span>
        )}
      </div>
    </div>
  );
}

export default function TournamentDetailClient({ tournament }: { tournament: TournamentSummary }) {
  const [activeTab, setActiveTab] = useState<TabId>("groups");
  const [groupsState, setGroupsState] = useState<AsyncState<StandingsGroup[]>>({
    hasLoaded: false,
    loading: true,
    error: "",
    data: [],
  });
  const [rankingsState, setRankingsState] = useState<AsyncState<RankingPlayer[]>>({
    hasLoaded: false,
    loading: false,
    error: "",
    data: [],
  });
  const [matchesState, setMatchesState] = useState<AsyncState<FixtureRow[]>>({
    hasLoaded: false,
    loading: false,
    error: "",
    data: [],
  });

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/public/standings?fixtureGroupIdentifier=${encodeURIComponent(tournament.id)}`)
      .then(async (response) => {
        const payload = (await response.json()) as StandingsResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load groups");
        }

        if (!cancelled) {
          setGroupsState({
            hasLoaded: true,
            loading: false,
            error: "",
            data: Array.isArray(payload.groups) ? payload.groups : [],
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setGroupsState({
            hasLoaded: true,
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load groups",
            data: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tournament.id]);

  useEffect(() => {
    if (activeTab !== "rankings" || rankingsState.loading || rankingsState.hasLoaded) {
      return;
    }

    let cancelled = false;
    setRankingsState((current) => ({ ...current, loading: true }));

    fetch(`/api/public/player-rankings?tournamentId=${encodeURIComponent(tournament.id)}`)
      .then(async (response) => {
        const payload = (await response.json()) as RankingsResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load rankings");
        }

        if (!cancelled) {
          setRankingsState({
            hasLoaded: true,
            loading: false,
            error: "",
            data: Array.isArray(payload.players) ? payload.players.slice().sort(comparePlayers) : [],
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRankingsState({
            hasLoaded: true,
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load rankings",
            data: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, rankingsState.hasLoaded, tournament.id]);

  useEffect(() => {
    if (activeTab !== "matches" || matchesState.loading || matchesState.hasLoaded) {
      return;
    }

    let cancelled = false;
    setMatchesState((current) => ({ ...current, loading: true }));

    fetch(`/api/public/fixtures?fixtureGroupIdentifier=${encodeURIComponent(tournament.id)}`)
      .then(async (response) => {
        const payload = (await response.json()) as FixturesResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load matches");
        }

        if (!cancelled) {
          setMatchesState({
            hasLoaded: true,
            loading: false,
            error: "",
            data: Array.isArray(payload.fixtures) ? payload.fixtures : [],
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMatchesState({
            hasLoaded: true,
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load matches",
            data: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, matchesState.hasLoaded, tournament.id]);

  return (
    <section className={styles.contentPanel}>
      <div className={styles.controlsHeader}>
        <div>
          <p className={styles.sectionEyebrow}>Tournament Views</p>
          <h2 className={styles.sectionTitle}>Groups, rankings, and published matches</h2>
          <p className={styles.sectionBodyCopy}>
            Switch between the tournament tables without leaving the page. The layout is ready for a future knockout section when that stage is exposed publicly.
          </p>
        </div>

        <div className={styles.tabList} role="tablist" aria-label="Tournament detail sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "groups"}
            className={`${styles.tabButton} ${activeTab === "groups" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("groups")}
          >
            Groups
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rankings"}
            className={`${styles.tabButton} ${activeTab === "rankings" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("rankings")}
          >
            Rankings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "matches"}
            className={`${styles.tabButton} ${activeTab === "matches" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            Matches
          </button>
        </div>
      </div>

      {activeTab === "groups" ? (
        groupsState.loading ? (
          <div className={styles.statusPanel}>Loading groups...</div>
        ) : groupsState.error ? (
          <div className={`${styles.statusPanel} ${styles.statusPanelError}`}>{groupsState.error}</div>
        ) : groupsState.data.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No groups available yet</h3>
            <p>This tournament does not have published group standings at the moment.</p>
          </div>
        ) : (
          <div className={styles.standingsGrid}>
            {groupsState.data.map((group) => (
              <section key={group.standingsDesc} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <div>
                    <p className={styles.sectionEyebrow}>Group Table</p>
                    <h3 className={styles.groupTitle}>{group.standingsDesc}</h3>
                  </div>
                  <p className={styles.groupMeta}>{group.count} players</p>
                </div>

                <div className={styles.tableWrap}>
                  <div className={styles.tableViewport}>
                    <table className={`${styles.table} ${styles.groupTable}`}>
                      <colgroup>
                        <col className={styles.colRank} />
                        <col className={styles.colPlayer} />
                        <col className={styles.colMatches} />
                        <col className={styles.colSmallStat} />
                        <col className={styles.colSmallStat} />
                        <col className={styles.colDiff} />
                        <col className={styles.colPoints} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>{renderHeaderLabel("RK", "Rank")}</th>
                          <th>{renderHeaderLabel("PLYR", "Player")}</th>
                          <th>{renderHeaderLabel("MP", "Matches Played")}</th>
                          <th>{renderHeaderLabel("W", "Wins")}</th>
                          <th>{renderHeaderLabel("L", "Losses")}</th>
                          <th>{renderHeaderLabel("+/-", "Frame Differential")}</th>
                          <th>{renderHeaderLabel("PTS", "Points")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row, index) => (
                          <tr key={`${group.standingsDesc}-${row.playerId ?? row.teamName}`} className={index % 2 === 0 ? styles.tableRow : `${styles.tableRow} ${styles.tableRowAlt}`}>
                            <td>{row.rank}</td>
                            <td className={styles.playerTextCell}>
                              {row.playerId ? (
                                <Link href={`/players/${row.playerId}`} className="public-player-link">
                                  {row.teamName}
                                </Link>
                              ) : (
                                row.teamName
                              )}
                            </td>
                            <td>{row.played}</td>
                            <td>{row.won}</td>
                            <td>{row.lost}</td>
                            <td>{row.diff}</td>
                            <td>{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )
      ) : null}

      {activeTab === "rankings" ? (
        rankingsState.loading ? (
          <div className={styles.statusPanel}>Loading rankings...</div>
        ) : rankingsState.error ? (
          <div className={`${styles.statusPanel} ${styles.statusPanelError}`}>{rankingsState.error}</div>
        ) : rankingsState.data.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No rankings available yet</h3>
            <p>Player rankings will appear here once this tournament has published entrants.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <div className={styles.tableViewport}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{renderHeaderLabel("RK", "Rank")}</th>
                    <th>{renderHeaderLabel("PLYR", "Player")}</th>
                    <th>{renderHeaderLabel("MP", "Matches Played")}</th>
                    <th>{renderHeaderLabel("PTS", "Points")}</th>
                    <th>{renderHeaderLabel("FW", "Frames Won")}</th>
                    <th>{renderHeaderLabel("FL", "Frames Lost")}</th>
                    <th>{renderHeaderLabel("FD", "Frame Differential")}</th>
                    <th>{renderHeaderLabel("HB", "High Break")}</th>
                    <th>{renderHeaderLabel("ELO", "ELO Rating")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingsState.data.map((player, index) => (
                    <tr key={player.id} className={index % 2 === 0 ? styles.tableRow : `${styles.tableRow} ${styles.tableRowAlt}`}>
                      <td>{index + 1}</td>
                      <td>
                        <PlayerCell
                          name={player.fullName}
                          href={`/players/${player.id}`}
                          photoUrl={player.photoUrl}
                          country={player.country}
                        />
                      </td>
                      <td>{player.matchesPlayed}</td>
                      <td>{player.points}</td>
                      <td>{player.framesWon}</td>
                      <td>{player.framesLost}</td>
                      <td>{player.frameDifferential}</td>
                      <td>{player.highBreak}</td>
                      <td>{player.eloRating ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}

      {activeTab === "matches" ? (
        matchesState.loading ? (
          <div className={styles.statusPanel}>Loading matches...</div>
        ) : matchesState.error ? (
          <div className={`${styles.statusPanel} ${styles.statusPanelError}`}>{matchesState.error}</div>
        ) : matchesState.data.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No matches published yet</h3>
            <p>Fixtures and scores will appear here once the tournament schedule is published.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <div className={styles.tableViewport}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{renderHeaderLabel("DATE", "Match Date")}</th>
                    <th>{renderHeaderLabel("ROUND", "Round")}</th>
                    <th>{renderHeaderLabel("HOME", "Home Player")}</th>
                    <th>{renderHeaderLabel("SCORE", "Score")}</th>
                    <th>{renderHeaderLabel("AWAY", "Away Player")}</th>
                    <th>{renderHeaderLabel("STATUS", "Match Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {matchesState.data.map((match, index) => {
                    const when = formatDateTimeLabel(match.fixtureDateTime);
                    const scoreLabel =
                      typeof match.homeScore === "number" && typeof match.roadScore === "number"
                        ? `${match.homeScore} - ${match.roadScore}`
                        : "vs";

                    return (
                      <tr key={match.fixtureId} className={index % 2 === 0 ? styles.tableRow : `${styles.tableRow} ${styles.tableRowAlt}`}>
                        <td>
                          <Link href={`/matches/${match.fixtureId}`} className={styles.matchDateLink}>
                            <span>{when.date}</span>
                            <span className={styles.playerSubtle}>{when.time || match.fixtureTime || "TBA"}</span>
                          </Link>
                        </td>
                        <td>
                          <div className={styles.roundCell}>
                            <span>{formatEnumLabel(match.roundType)}</span>
                          </div>
                        </td>
                        <td>
                          <PlayerCell
                            name={match.homeTeamName}
                            href={match.homePlayerId ? `/players/${match.homePlayerId}` : null}
                            photoUrl={match.homePlayerPhotoUrl}
                            country={match.homeCountryCode}
                          />
                        </td>
                        <td>
                          <Link href={`/matches/${match.fixtureId}`} className={styles.scorePill}>
                            {scoreLabel}
                          </Link>
                        </td>
                        <td>
                          <PlayerCell
                            name={match.roadTeamName}
                            href={match.roadPlayerId ? `/players/${match.roadPlayerId}` : null}
                            photoUrl={match.roadPlayerPhotoUrl}
                            country={match.roadCountryCode}
                          />
                        </td>
                        <td>
                          <span className={getStatusBadgeClassName(match.matchStatus || match.scheduleStatus)}>
                            {formatEnumLabel(match.matchStatus || match.scheduleStatus)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : null}
    </section>
  );
}