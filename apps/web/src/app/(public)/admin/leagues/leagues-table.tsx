"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

export type LeagueRow = {
  id: string;
  leagueName: string;
  description: string;
  isActive: boolean;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
  canDelete: boolean;
  dependencySummary: string;
};

export type LeaguesTableProps = {
  leagues: LeagueRow[];
};

type SortKey = "leagueName" | "description" | "isActive";

export default function LeaguesTable({ leagues }: LeaguesTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("leagueName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [leagueToDelete, setLeagueToDelete] = useState<LeagueRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filteredLeagues = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? leagues
      : leagues.filter((league) =>
          league.leagueName.toLowerCase().includes(term) ||
          league.description.toLowerCase().includes(term)
        );

    return sortRows(
      rows,
      (league) => {
        switch (sortKey) {
          case "description":
            return league.description;
          case "isActive":
            return league.isActive;
          case "leagueName":
          default:
            return league.leagueName;
        }
      },
      sortDirection
    );
  }, [leagues, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const openDeleteModal = (league: LeagueRow) => {
    setError(null);
    setLeagueToDelete(league);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setLeagueToDelete(null);
  };

  const handleDelete = async () => {
    if (!leagueToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/leagues/${leagueToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete league."
        );
      }

      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete league."
      );
    } finally {
      setDeleting(false);
      setLeagueToDelete(null);
    }
  };

  return (
    <>
      {error ? (
        <div className="admin-form-error" style={{ marginBottom: "14px" }}>
          {error}
        </div>
      ) : null}

    <div className="admin-table-wrapper">
      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search leagues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-players-toolbar-right">
          <Link href="/admin/leagues/new" className="admin-toolbar-button admin-toolbar-button-add">
            <FiPlus />
            <span>Add League</span>
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
                  columnKey="leagueName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Description"
                  columnKey="description"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Status"
                  columnKey="isActive"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeagues.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-players-empty">No leagues found.</td>
                </tr>
              ) : (
                filteredLeagues.map(l => (
                  <tr key={l.id}>
                    <td>{l.leagueName}</td>
                    <td>{l.description}</td>
                    <td>{l.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/leagues/${l.id}`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${l.leagueName}`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>
                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          aria-label={`Delete ${l.leagueName}`}
                          title="Delete"
                          onClick={() => openDeleteModal(l)}
                          disabled={deleting}
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
    </div>

      {leagueToDelete ? (
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
            aria-labelledby="league-delete-title"
          >
            <h2 id="league-delete-title" className="admin-modal-title">
              {leagueToDelete.canDelete ? "Delete league?" : "League cannot be deleted"}
            </h2>

            {leagueToDelete.canDelete ? (
              <p className="admin-modal-text">
                You are about to delete <strong>{leagueToDelete.leagueName}</strong>.
                This action cannot be undone.
              </p>
            ) : (
              <p className="admin-modal-text">
                <strong>{leagueToDelete.leagueName}</strong> cannot be deleted because it still contains {leagueToDelete.dependencySummary}.
                Remove the related data first.
              </p>
            )}

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                {leagueToDelete.canDelete ? "Cancel" : "Close"}
              </button>

              {leagueToDelete.canDelete ? (
                <button
                  type="button"
                  className="admin-modal-button admin-modal-button-delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
