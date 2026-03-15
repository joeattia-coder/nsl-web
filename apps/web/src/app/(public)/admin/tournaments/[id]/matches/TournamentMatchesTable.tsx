"use client";

import { useMemo, useState } from "react";

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

  const filteredMatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return matches;

    return matches.filter((match) => {
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
  }, [matches, search]);

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
                <th>Stage</th>
                <th>Round</th>
                <th>Group</th>
                <th>Home</th>
                <th>Away</th>
                <th>Score</th>
                <th>Winner</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Venue</th>
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