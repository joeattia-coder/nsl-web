"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiEdit2, FiLayers, FiPlus, FiTrash2 } from "react-icons/fi";

type TournamentRow = {
  id: string;
  tournamentName: string;
  seasonName: string;
  venueName: string;
  participantType: string;
  status: string;
  isPublished: boolean;
  startDate: string;
  endDate: string;
};

type TournamentsTableProps = {
  tournaments: TournamentRow[];
};

type SortKey =
  | "tournamentName"
  | "seasonName"
  | "venueName"
  | "participantType"
  | "status"
  | "isPublished"
  | "startDate"
  | "endDate";

function formatDate(date: string) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(date));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TournamentsTable({
  tournaments,
}: TournamentsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("tournamentName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [tournamentToDelete, setTournamentToDelete] =
    useState<TournamentRow | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredTournaments = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? tournaments
      : tournaments.filter((tournament) => {
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
      rows,
      (tournament) => {
        switch (sortKey) {
          case "seasonName":
            return tournament.seasonName;
          case "venueName":
            return tournament.venueName;
          case "participantType":
            return tournament.participantType;
          case "status":
            return formatStatus(tournament.status);
          case "isPublished":
            return tournament.isPublished;
          case "startDate":
            return tournament.startDate;
          case "endDate":
            return tournament.endDate;
          case "tournamentName":
          default:
            return tournament.tournamentName;
        }
      },
      sortDirection
    );
  }, [tournaments, search, sortDirection, sortKey]);

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
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search tournaments..."
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
                  label="Season"
                  columnKey="seasonName"
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
                  label="Start"
                  columnKey="startDate"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="End"
                  columnKey="endDate"
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
                  <td colSpan={9} className="admin-players-empty">
                    No tournaments found.
                  </td>
                </tr>
              ) : (
                filteredTournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td>
                      <span className="admin-player-full-name">
                        {tournament.tournamentName}
                      </span>
                    </td>
                    <td>{tournament.seasonName || "—"}</td>

                    <td>{tournament.venueName || "—"}</td>
                    <td>{tournament.participantType}</td>
                    <td>{formatStatus(tournament.status)}</td>
                    <td>{tournament.isPublished ? "Yes" : "No"}</td>
                    <td>{formatDate(tournament.startDate)}</td>
                    <td>{formatDate(tournament.endDate)}</td>

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

                        <Link
                          href={`/admin/tournaments/${tournament.id}/stages`}
                          className="admin-icon-action"
                          aria-label={`Manage stages for ${tournament.tournamentName}`}
                          title="Stages"
                        >
                          <FiLayers />
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