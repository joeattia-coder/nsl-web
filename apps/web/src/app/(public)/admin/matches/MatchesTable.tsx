"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiEdit2 } from "react-icons/fi";

export type MatchRow = {
  id: string;
  tournamentId: string;
  leagueId: string;
  leagueName: string;
  tournamentId2: string;
  tournamentName: string;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  venueName: string;
  matchDate: string;
};

type Props = {
  matches: MatchRow[];
  leagues: { id: string; leagueName: string }[];
  tournaments: { id: string; tournamentName: string; leagueId: string }[];
  defaultLeagueId: string | null;
};

type SortKey =
  | "homeName"
  | "awayName"
  | "leagueName"
  | "tournamentName"
  | "venueName"
  | "matchDate";

function formatDate(dateString: string) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(dateString));
}

function formatScore(homeScore: number | null, awayScore: number | null) {
  if (homeScore === null || awayScore === null) return "—";
  return `${homeScore} – ${awayScore}`;
}

export default function MatchesTable({
  matches,
  leagues,
  tournaments,
  defaultLeagueId,
}: Props) {
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<string>(
    defaultLeagueId ?? "all"
  );
  const [tournamentFilter, setTournamentFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("matchDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // When league changes reset tournament filter
  const handleLeagueChange = (value: string) => {
    setLeagueFilter(value);
    setTournamentFilter("all");
  };

  const availableTournaments = useMemo(() => {
    if (leagueFilter === "all") return tournaments;
    return tournaments.filter((t) => t.leagueId === leagueFilter);
  }, [tournaments, leagueFilter]);

  const filteredMatches = useMemo(() => {
    const term = search.trim().toLowerCase();

    let rows = matches;

    if (leagueFilter !== "all") {
      rows = rows.filter((m) => m.leagueId === leagueFilter);
    }

    if (tournamentFilter !== "all") {
      rows = rows.filter((m) => m.tournamentId2 === tournamentFilter);
    }

    if (term) {
      rows = rows.filter(
        (m) =>
          m.homeName.toLowerCase().includes(term) ||
          m.awayName.toLowerCase().includes(term) ||
          m.leagueName.toLowerCase().includes(term) ||
          m.tournamentName.toLowerCase().includes(term) ||
          m.venueName.toLowerCase().includes(term)
      );
    }

    return sortRows(
      rows,
      (m) => {
        switch (sortKey) {
          case "homeName":
            return m.homeName;
          case "awayName":
            return m.awayName;
          case "leagueName":
            return m.leagueName;
          case "tournamentName":
            return m.tournamentName;
          case "venueName":
            return m.venueName;
          case "matchDate":
          default:
            return m.matchDate;
        }
      },
      sortDirection
    );
  }, [matches, search, leagueFilter, tournamentFilter, sortKey, sortDirection]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(columnKey);
    setSortDirection("asc");
  };

  return (
    <>
      <div className="admin-players-toolbar admin-matches-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search by player name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <select
            className="admin-search-input admin-matches-filter"
            value={leagueFilter}
            onChange={(e) => handleLeagueChange(e.target.value)}
            aria-label="Filter by league"
          >
            <option value="all">All Leagues</option>
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.leagueName}
              </option>
            ))}
          </select>

          <select
            className="admin-search-input admin-matches-filter"
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            aria-label="Filter by tournament"
          >
            <option value="all">All Tournaments</option>
            {availableTournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tournamentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <SortableHeader
                  label="Player 1"
                  columnKey="homeName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Player 2"
                  columnKey="awayName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th>Score</th>
                <SortableHeader
                  label="League"
                  columnKey="leagueName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Tournament"
                  columnKey="tournamentName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Venue"
                  columnKey="venueName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Date"
                  columnKey="matchDate"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-players-empty">
                    No matches found.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <Link
                        href={`/admin/tournaments/${match.tournamentId}/matches/${match.id}/edit`}
                        className="admin-player-full-name"
                      >
                        {match.homeName}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/admin/tournaments/${match.tournamentId}/matches/${match.id}/edit`}
                        className="admin-player-full-name"
                      >
                        {match.awayName}
                      </Link>
                    </td>
                    <td>{formatScore(match.homeScore, match.awayScore)}</td>
                    <td>{match.leagueName || "—"}</td>
                    <td>{match.tournamentName || "—"}</td>
                    <td>{match.venueName || "—"}</td>
                    <td>{formatDate(match.matchDate)}</td>
                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/tournaments/${match.tournamentId}/matches/${match.id}/edit`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${match.homeName} vs ${match.awayName}`}
                          title="Edit scores"
                        >
                          <FiEdit2 />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
