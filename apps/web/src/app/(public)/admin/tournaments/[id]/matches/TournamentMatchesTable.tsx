"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { consumeAdminFlashMessage } from "@/lib/admin-flash";
import type { TournamentMatchesLiveResponse, TournamentMatchesLiveSnapshot } from "@/lib/live-match";
import { formatDateInAdminTimeZone } from "@/lib/timezone";
import { useLivePolling } from "@/lib/useLivePolling";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

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
  bestOfFrames: number;
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
  tournamentName: string;
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

  return (
    formatDateInAdminTimeZone(
      dateString,
      {
        year: "numeric",
        month: "short",
        day: "2-digit",
      },
      "en-CA"
    ) || "—"
  );
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

function formatBestOf(bestOfFrames: number | null | undefined) {
  if (!bestOfFrames || bestOfFrames < 1) {
    return "Bo5";
  }

  return `Bo${bestOfFrames}`;
}

function applyLiveSnapshots(current: MatchRow[], snapshots: TournamentMatchesLiveSnapshot[]) {
  if (current.length === 0 || snapshots.length === 0) {
    return current;
  }

  const updates = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  let changed = false;

  const next = current.map((match) => {
    const snapshot = updates.get(match.id);

    if (!snapshot) {
      return match;
    }

    if (
      match.homeScore === snapshot.homeScore &&
      match.awayScore === snapshot.awayScore &&
      match.winnerName === snapshot.winnerName &&
      match.bestOfFrames === snapshot.bestOfFrames &&
      match.matchDate === snapshot.matchDate &&
      match.matchTime === snapshot.matchTime &&
      match.matchStatus === snapshot.matchStatus &&
      match.scheduleStatus === snapshot.scheduleStatus &&
      match.venueName === snapshot.venueName
    ) {
      return match;
    }

    changed = true;

    return {
      ...match,
      homeScore: snapshot.homeScore,
      awayScore: snapshot.awayScore,
      winnerName: snapshot.winnerName,
      bestOfFrames: snapshot.bestOfFrames,
      matchDate: snapshot.matchDate,
      matchTime: snapshot.matchTime,
      matchStatus: snapshot.matchStatus,
      scheduleStatus: snapshot.scheduleStatus,
      venueName: snapshot.venueName,
    };
  });

  return changed ? next : current;
}

export default function TournamentMatchesTable({
  tournamentId,
  tournamentName,
  matches,
}: TournamentMatchesTableProps) {
  const router = useRouter();
  const [liveMatches, setLiveMatches] = useState(matches);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("matchDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
    shouldRefresh?: boolean;
  } | null>(null);

  useEffect(() => {
    const flashMessage = consumeAdminFlashMessage(`tournament-matches:${tournamentId}`);

    if (flashMessage) {
      setFeedbackModal(flashMessage);
    }
  }, [tournamentId]);

  useEffect(() => {
    setLiveMatches(matches);
  }, [matches]);

  useLivePolling({
    enabled: liveMatches.length > 0,
    intervalMs: 3000,
    poll: async (signal) => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/matches/live`, {
        signal,
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as TournamentMatchesLiveResponse | null;

      if (!response.ok) {
        throw new Error(data && "error" in data ? String(data.error ?? "Failed to fetch live tournament matches.") : "Failed to fetch live tournament matches.");
      }

      setLiveMatches((current) => applyLiveSnapshots(current, data?.items ?? []));
    },
  });

  const filteredMatches = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? liveMatches
      : liveMatches.filter((match) => {
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
  }, [liveMatches, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  function openDeleteModal() {
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (isDeletingAll) {
      return;
    }

    setIsDeleteModalOpen(false);
  }

  async function handleDeleteAllMatches() {
    try {
      setIsDeletingAll(true);

      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament matches."
        );
      }

      setIsDeleteModalOpen(false);
      setFeedbackModal({
        title: "Delete All Matches Complete",
        message: `Deleted ${data?.deletedCount ?? 0} match${data?.deletedCount === 1 ? "" : "es"} from ${tournamentName}.`,
        shouldRefresh: true,
      });
    } catch (error) {
      console.error(error);
      setIsDeleteModalOpen(false);
      setFeedbackModal({
        title: "Could not delete matches",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete tournament matches.",
      });
    } finally {
      setIsDeletingAll(false);
    }
  }

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

        <div className="admin-players-toolbar-right">
          <button
            type="button"
            className="admin-toolbar-button admin-toolbar-button-danger"
            onClick={openDeleteModal}
            disabled={liveMatches.length === 0 || isDeletingAll}
          >
            <FiTrash2 />
            <span>Delete All Matches</span>
          </button>
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
                    <td>
                      <Link
                        href={`/admin/tournaments/${tournamentId}/matches/${match.id}/edit`}
                        className="admin-player-full-name"
                      >
                        {match.homeName}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/admin/tournaments/${tournamentId}/matches/${match.id}/edit`}
                        className="admin-player-full-name"
                      >
                        {match.awayName}
                      </Link>
                    </td>
                    <td>
                      <div className="match-score-cell">
                        <span>{formatScore(match.homeScore, match.awayScore)}</span>
                        <span className="match-best-of-badge">
                          {formatBestOf(match.bestOfFrames)}
                        </span>
                      </div>
                    </td>
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

      {isDeleteModalOpen ? (
        <div
          className="admin-modal-backdrop"
          onClick={closeDeleteModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-all-matches-title"
          >
            <h2 id="delete-all-matches-title" className="admin-modal-title">
              Delete all tournament matches?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete all <strong>{liveMatches.length}</strong>{" "}
              generated match{liveMatches.length === 1 ? "" : "es"} for <strong>{tournamentName}</strong>.
            </p>

            <p className="admin-modal-text">
              This action cannot be undone.
            </p>

            <p className="admin-modal-text">
              This will also delete related frame results and match history. Use this
              before changing group assignments or removing entries from the tournament.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeDeleteModal}
                disabled={isDeletingAll}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleDeleteAllMatches}
                disabled={isDeletingAll}
              >
                {isDeletingAll ? "Deleting..." : "Delete All Matches"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            const shouldRefresh = feedbackModal.shouldRefresh;
            setFeedbackModal(null);
            if (shouldRefresh) {
              router.refresh();
            }
          }}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="matches-feedback-title"
          >
            <h2 id="matches-feedback-title" className="admin-modal-title">
              {feedbackModal.title}
            </h2>

            <p className="admin-modal-text">{feedbackModal.message}</p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => {
                  const shouldRefresh = feedbackModal.shouldRefresh;
                  setFeedbackModal(null);
                  if (shouldRefresh) {
                    router.refresh();
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}