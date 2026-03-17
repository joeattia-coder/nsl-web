"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiArrowLeft, FiEdit2, FiFolder, FiPlus, FiTrash2 } from "react-icons/fi";

type RoundRow = {
  id: string;
  roundName: string;
  roundType: string;
  sequence: number;
  matchesPerPairing: number;
  groupsCount: number;
  matchesCount: number;
};

type StageRoundsTableProps = {
  tournamentId: string;
  tournamentName: string;
  stageId: string;
  stageName: string;
  rounds: RoundRow[];
};

type SortKey =
  | "roundName"
  | "roundType"
  | "sequence"
  | "matchesPerPairing"
  | "groupsCount"
  | "matchesCount";

function formatRoundType(roundType: string) {
  return roundType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StageRoundsTable({
  tournamentId,
  stageId,
  stageName,
  rounds,
}: StageRoundsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sequence");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [roundToDelete, setRoundToDelete] = useState<RoundRow | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredRounds = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? rounds
      : rounds.filter((round) => {
          return (
            round.roundName.toLowerCase().includes(term) ||
            formatRoundType(round.roundType).toLowerCase().includes(term) ||
            String(round.sequence).includes(term)
          );
        });

    return sortRows(
      rows,
      (round) => {
        switch (sortKey) {
          case "roundName":
            return round.roundName;
          case "roundType":
            return formatRoundType(round.roundType);
          case "matchesPerPairing":
            return round.matchesPerPairing;
          case "groupsCount":
            return round.groupsCount;
          case "matchesCount":
            return round.matchesCount;
          case "sequence":
          default:
            return round.sequence;
        }
      },
      sortDirection
    );
  }, [rounds, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const openSingleDeleteModal = (round: RoundRow) => {
    setActionError(null);
    setRoundToDelete(round);
  };

  const closeSingleDeleteModal = () => {
    if (deletingSingle) return;
    setRoundToDelete(null);
  };

  const confirmSingleDelete = async () => {
    if (!roundToDelete) return;

    try {
      setDeletingSingle(true);
      setActionError(null);

      const res = await fetch(`/api/tournaments/rounds/${roundToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete stage round."
        );
      }

      setRoundToDelete(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete stage round."
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
            placeholder="Search rounds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <Link
            href={`/admin/tournaments/${tournamentId}/stages`}
            className="admin-toolbar-button admin-toolbar-button-cancel"
          >
            <FiArrowLeft />
            <span>Back to Stages</span>
          </Link>

          <Link
            href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/new`}
            className="admin-toolbar-button admin-toolbar-button-add"
          >
            <FiPlus />
            <span>Add Round</span>
          </Link>
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <SortableHeader
                  label="Round Name"
                  columnKey="roundName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Type"
                  columnKey="roundType"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Sequence"
                  columnKey="sequence"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Matches / Pairing"
                  columnKey="matchesPerPairing"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Groups"
                  columnKey="groupsCount"
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
              {filteredRounds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-players-empty">
                    No rounds found for {stageName}.
                  </td>
                </tr>
              ) : (
                filteredRounds.map((round) => (
                  <tr key={round.id}>
                    <td>
                      <Link
                        href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${round.id}/edit`}
                        className="admin-player-full-name"
                      >
                        {round.roundName}
                      </Link>
                    </td>
                    <td>{formatRoundType(round.roundType)}</td>
                    <td>{round.sequence}</td>
                    <td>{round.matchesPerPairing}</td>
                    <td>{round.groupsCount}</td>
                    <td>{round.matchesCount}</td>
                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${round.id}/edit`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${round.roundName}`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>

                        <Link
                          href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${round.id}/groups`}
                          className="admin-icon-action"
                          aria-label={`Manage groups for ${round.roundName}`}
                          title="Groups"
                        >
                          <FiFolder />
                        </Link>

                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          aria-label={`Delete ${round.roundName}`}
                          title="Delete"
                          onClick={() => openSingleDeleteModal(round)}
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

      {roundToDelete && (
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
            aria-labelledby="single-delete-round-title"
          >
            <h2 id="single-delete-round-title" className="admin-modal-title">
              Delete round?
            </h2>

            <p className="admin-modal-text">
              You are about to delete <strong>{roundToDelete.roundName}</strong>.
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