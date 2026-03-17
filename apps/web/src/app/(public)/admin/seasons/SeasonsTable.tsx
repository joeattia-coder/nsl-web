"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiCalendar, FiCheck, FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";

type SeasonRow = {
  id: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  leagueName: string;
};

type SeasonsTableProps = {
  seasons: SeasonRow[];
};

type SortKey = "seasonName" | "leagueName" | "startDate" | "endDate" | "isActive";

export default function SeasonsTable({ seasons }: SeasonsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("seasonName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [seasonToDelete, setSeasonToDelete] = useState<SeasonRow | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredSeasons = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? seasons
      : seasons.filter((season) =>
          season.seasonName.toLowerCase().includes(term)
        );

    return sortRows(
      rows,
      (season) => {
        switch (sortKey) {
          case "leagueName":
            return season.leagueName;
          case "startDate":
            return season.startDate;
          case "endDate":
            return season.endDate;
          case "isActive":
            return season.isActive;
          case "seasonName":
          default:
            return season.seasonName;
        }
      },
      sortDirection
    );
  }, [seasons, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const openSingleDeleteModal = (season: SeasonRow) => {
    setActionError(null);
    setSeasonToDelete(season);
  };

  const closeSingleDeleteModal = () => {
    if (deletingSingle) return;
    setSeasonToDelete(null);
  };

  const confirmSingleDelete = async () => {
    if (!seasonToDelete) return;

    try {
      setDeletingSingle(true);
      setActionError(null);

      const res = await fetch(`/api/seasons/${seasonToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete season."
        );
      }

      setSeasonToDelete(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete season."
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
            placeholder="Search seasons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <Link
            href="/admin/seasons/new"
            className="admin-toolbar-button admin-toolbar-button-add"
          >
            <FiPlus />
            <span>Add Season</span>
          </Link>
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <SortableHeader
                  label="Season Name"
                  columnKey="seasonName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="League"
                  columnKey="leagueName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Start Date"
                  columnKey="startDate"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="End Date"
                  columnKey="endDate"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Active"
                  columnKey="isActive"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSeasons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-players-empty">
                    No seasons found.
                  </td>
                </tr>
              ) : (
                filteredSeasons.map((season) => (
                  <tr key={season.id}>
                    <td>
                      <div className="admin-season-name-cell">
                        <span className="admin-season-name-icon">
                          <FiCalendar />
                        </span>
                        <Link
                          href={`/admin/seasons/${season.id}/edit`}
                          className="admin-season-name-text"
                        >
                          {season.seasonName}
                        </Link>
                      </div>
                    </td>
                    <td>{season.leagueName || "—"}</td>
                    <td>{formatDate(season.startDate)}</td>
                    <td>{formatDate(season.endDate)}</td>
                    <td>
                      <div className="admin-venue-show-cell">
                        {season.isActive ? (
                          <span
                            className="admin-venue-show-icon admin-venue-show-icon-yes"
                            title="Active"
                            aria-label="Active"
                          >
                            <FiCheck />
                          </span>
                        ) : (
                          <span
                            className="admin-venue-show-icon admin-venue-show-icon-no"
                            title="Inactive"
                            aria-label="Inactive"
                          >
                            <FiX />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/seasons/${season.id}/edit`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${season.seasonName}`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>
                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          aria-label={`Delete ${season.seasonName}`}
                          title="Delete"
                          onClick={() => openSingleDeleteModal(season)}
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

      {seasonToDelete && (
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
              Delete season?
            </h2>

            <p className="admin-modal-text">
              You are about to delete <strong>{seasonToDelete.seasonName}</strong>.
              This action cannot be undone.
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

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-CA");
}