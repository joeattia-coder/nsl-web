"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

type TournamentRow = {
  id: string;
  seasonId: string;
  tournamentName: string;
  seasonName: string;
  venueName: string;
  participantType: string;
  status: string;
  isPublished: boolean;
  startDate: string;
  endDate: string;
  entriesCount: number;
  matchesCount: number;
};

type SeasonOption = {
  id: string;
  seasonName: string;
  startDate: string;
  endDate: string;
};

type TournamentsTableProps = {
  tournaments: TournamentRow[];
  seasons: SeasonOption[];
};

type SortKey =
  | "tournamentName"
  | "participantType"
  | "status"
  | "isPublished"
  | "entriesCount"
  | "matchesCount";

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TournamentsTable({
  tournaments,
  seasons,
}: TournamentsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("tournamentName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [tournamentToDelete, setTournamentToDelete] =
    useState<TournamentRow | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const defaultSeasonId = useMemo(() => {
    const today = new Date();

    const currentSeason = seasons.find((season) => {
      if (!season.startDate && !season.endDate) return false;

      const seasonStart = season.startDate ? new Date(season.startDate) : null;
      const seasonEnd = season.endDate ? new Date(season.endDate) : null;

      const startsBeforeToday = seasonStart ? seasonStart <= today : true;
      const endsAfterToday = seasonEnd ? seasonEnd >= today : true;

      return startsBeforeToday && endsAfterToday;
    });

    return currentSeason?.id ?? seasons[0]?.id ?? "";
  }, [seasons]);

  const [selectedSeasonId, setSelectedSeasonId] = useState(defaultSeasonId);

  const filteredTournaments = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rowsBySeason = selectedSeasonId
      ? tournaments.filter((tournament) => tournament.seasonId === selectedSeasonId)
      : tournaments;

    const rowsBySearch = !term
      ? rowsBySeason
      : rowsBySeason.filter((tournament) => {
          return (
            tournament.tournamentName.toLowerCase().includes(term) ||
            tournament.seasonName.toLowerCase().includes(term) ||
            tournament.venueName.toLowerCase().includes(term) ||
            tournament.participantType.toLowerCase().includes(term) ||
            formatStatus(tournament.status).toLowerCase().includes(term) ||
            (tournament.isPublished ? "yes" : "no").includes(term)
          );
        });

    return sortRows(
      rowsBySearch,
      (tournament) => {
        switch (sortKey) {
          case "participantType":
            return tournament.participantType;
          case "status":
            return formatStatus(tournament.status);
          case "isPublished":
            return tournament.isPublished;
          case "entriesCount":
            return tournament.entriesCount;
          case "matchesCount":
            return tournament.matchesCount;
          case "tournamentName":
          default:
            return tournament.tournamentName;
        }
      },
      sortDirection
    );
  }, [tournaments, selectedSeasonId, search, sortDirection, sortKey]);

  const seasonLabel =
    seasons.find((season) => season.id === selectedSeasonId)?.seasonName ??
    "selected season";

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
  };

  const rowsForSeason = selectedSeasonId
    ? tournaments.filter((tournament) => tournament.seasonId === selectedSeasonId)
    : tournaments;

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const openSingleDeleteModal = (tournament: TournamentRow) => {
    setActionError(null);
    setTournamentToDelete(tournament);
  };

  const closeSingleDeleteModal = () => {
    if (deletingSingle) return;
    setTournamentToDelete(null);
  };

  const confirmSingleDelete = async () => {
    if (!tournamentToDelete) return;

    try {
      setDeletingSingle(true);
      setActionError(null);

      const res = await fetch(`/api/tournaments/${tournamentToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament."
        );
      }

      setTournamentToDelete(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete tournament."
      );
    } finally {
      setDeletingSingle(false);
    }
  };

  return (
    <>
      {actionError ? (
        <div className="admin-form-error" style={{ marginBottom: "14px" }}>
          {actionError}
        </div>
      ) : null}

      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <select
            className="admin-select admin-players-search admin-tournaments-season-filter"
            value={selectedSeasonId}
            onChange={(e) => handleSeasonChange(e.target.value)}
            aria-label="Filter tournaments by season"
            style={{ width: "220px", minWidth: "220px", marginRight: "12px" }}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.seasonName}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder={`Search ${seasonLabel} tournaments...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <Link
            href="/admin/tournaments/new"
            className="admin-toolbar-button admin-toolbar-button-add"
          >
            <FiPlus />
            <span>Add Tournament</span>
          </Link>
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <SortableHeader
                  label="Name"
                  columnKey="tournamentName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Type"
                  columnKey="participantType"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Status"
                  columnKey="status"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Published"
                  columnKey="isPublished"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Entries"
                  columnKey="entriesCount"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Matches"
                  columnKey="matchesCount"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTournaments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-players-empty">
                    {rowsForSeason.length === 0
                      ? "No tournaments found for this season."
                      : "No tournaments match your search."}
                  </td>
                </tr>
              ) : (
                filteredTournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td>
                      <Link
                        href={`/admin/tournaments/${tournament.id}/edit`}
                        className="admin-player-full-name admin-tournament-name-link"
                      >
                        {tournament.tournamentName}
                      </Link>
                    </td>
                    <td>{tournament.participantType}</td>
                    <td>{formatStatus(tournament.status)}</td>
                    <td>{tournament.isPublished ? "Yes" : "No"}</td>
                    <td>{tournament.entriesCount}</td>
                    <td>{tournament.matchesCount}</td>

                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/tournaments/${tournament.id}/edit`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${tournament.tournamentName}`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>

                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          aria-label={`Delete ${tournament.tournamentName}`}
                          title="Delete"
                          onClick={() => openSingleDeleteModal(tournament)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {tournamentToDelete && (
        <div
          className="admin-modal-backdrop"
          onClick={closeSingleDeleteModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="single-delete-title"
          >
            <h2 id="single-delete-title" className="admin-modal-title">
              Delete tournament?
            </h2>

            <p className="admin-modal-text">
              You are about to delete{" "}
              <strong>{tournamentToDelete.tournamentName}</strong>. This action
              cannot be undone.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeSingleDeleteModal}
                disabled={deletingSingle}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={confirmSingleDelete}
                disabled={deletingSingle}
              >
                {deletingSingle ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}