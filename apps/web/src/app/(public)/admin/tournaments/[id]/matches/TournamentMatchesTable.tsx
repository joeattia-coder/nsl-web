"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiEdit2 } from "react-icons/fi";

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
  tournamentId,
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
          default:
            return match.matchDate;
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
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="admin-players-empty">
                    No matches found.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((match) => (
                  <tr key={match.id}>
                    <td>{match.groupName || "—"}</td>
                    <td>{match.homeName}</td>
                    <td>{match.awayName}</td>
                    <td>{formatScore(match.homeScore, match.awayScore)}</td>
                    <td>{match.winnerName || "—"}</td>
                    <td>{formatDate(match.matchDate)}</td>
                    <td>{match.matchTime || "—"}</td>
                    <td>{formatStatus(match.matchStatus)}</td>
                    <td>{match.venueName || "—"}</td>
                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/tournaments/${tournamentId}/matches/${match.id}/edit`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${match.homeName} vs ${match.awayName}`}
                          title="Edit results"
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