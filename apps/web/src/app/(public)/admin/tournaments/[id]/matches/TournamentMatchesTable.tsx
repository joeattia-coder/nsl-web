"use client";

import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";

type MatchRow = {
  id: string;
  stageName: string;
  stageType: string;
  roundName: string;
  roundType: string;
  groupName: string;
  homeName: string;
  awayName: string;
  winnerName: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  matchTime: string;
  matchStatus: string;
  scheduleStatus: string;
  venueName: string;
};

type TournamentMatchesTableProps = {
  tournamentId: string;
  matches: MatchRow[];
};

type SortKey =
  | "stageName"
  | "roundName"
  | "groupName"
  | "homeName"
  | "awayName"
  | "score"
  | "winnerName"
  | "matchDate"
  | "matchTime"
  | "matchStatus"
  | "venueName";

function formatDate(dateString: string) {
  if (!dateString) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(dateString));
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatScore(homeScore: number | null, awayScore: number | null) {
  if (homeScore === null || awayScore === null) {
    return "—";
  }

  return `${homeScore} - ${awayScore}`;
}

export default function TournamentMatchesTable({
  matches,
}: TournamentMatchesTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("matchDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredMatches = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? matches
      : matches.filter((match) => {
          return (
            match.stageName.toLowerCase().includes(term) ||
            match.roundName.toLowerCase().includes(term) ||
            match.groupName.toLowerCase().includes(term) ||
            match.homeName.toLowerCase().includes(term) ||
            match.awayName.toLowerCase().includes(term) ||
            match.venueName.toLowerCase().includes(term) ||
            formatStatus(match.matchStatus).toLowerCase().includes(term) ||
            formatStatus(match.scheduleStatus).toLowerCase().includes(term)
          );
        });

    return sortRows(
      rows,
      (match) => {
        switch (sortKey) {
          case "roundName":
            return match.roundName;
          case "groupName":
            return match.groupName;
          case "homeName":
            return match.homeName;
          case "awayName":
            return match.awayName;
          case "score":
            return match.homeScore === null || match.awayScore === null
              ? null
              : `${match.homeScore}-${match.awayScore}`;
          case "winnerName":
            return match.winnerName;
          case "matchDate":
            return match.matchDate;
          case "matchTime":
            return match.matchTime;
          case "matchStatus":
            return formatStatus(match.matchStatus);
          case "venueName":
            return match.venueName;
          case "stageName":
          default:
            return match.stageName;
        }
      },
      sortDirection
    );
  }, [matches, search, sortDirection, sortKey]);

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
      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search matches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <SortableHeader
                  label="Stage"
                  columnKey="stageName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Round"
                  columnKey="roundName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Group"
                  columnKey="groupName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Home"
                  columnKey="homeName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Away"
                  columnKey="awayName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Score"
                  columnKey="score"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Winner"
                  columnKey="winnerName"
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
                <SortableHeader
                  label="Time"
                  columnKey="matchTime"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Status"
                  columnKey="matchStatus"
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
              </tr>
            </thead>

            <tbody>
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="admin-players-empty">
                    No matches found.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((match) => (
                  <tr key={match.id}>
                    <td>
                      <div className="admin-match-stage-cell">
                        <div className="admin-player-full-name">{match.stageName}</div>
                        <div className="admin-match-meta-text">{match.stageType}</div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-match-stage-cell">
                        <div>{match.roundName}</div>
                        <div className="admin-match-meta-text">{match.roundType}</div>
                      </div>
                    </td>
                    <td>{match.groupName || "—"}</td>
                    <td>{match.homeName}</td>
                    <td>{match.awayName}</td>
                    <td>{formatScore(match.homeScore, match.awayScore)}</td>
                    <td>{match.winnerName || "—"}</td>
                    <td>{formatDate(match.matchDate)}</td>
                    <td>{match.matchTime || "—"}</td>
                    <td>{formatStatus(match.matchStatus)}</td>
                    <td>{match.venueName || "—"}</td>
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