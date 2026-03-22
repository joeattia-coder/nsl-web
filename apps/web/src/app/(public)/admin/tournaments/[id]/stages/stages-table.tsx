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
import { FiEdit2, FiPlus, FiTrash2, FiFolder } from "react-icons/fi";

type StageRow = {
  id: string;
  stageName: string;
  stageType: string;
  sequence: number;
  roundsCount: number;
  matchesCount: number;
};

type TournamentStagesTableProps = {
  tournamentId: string;
  tournamentName: string;
  stages: StageRow[];
};

type SortKey = "stageName" | "stageType" | "sequence" | "roundsCount" | "matchesCount";

function formatStageType(stageType: string) {
  return stageType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function TournamentStagesTable({
  tournamentId,
  tournamentName,
  stages,
}: TournamentStagesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sequence");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [stageToDelete, setStageToDelete] = useState<StageRow | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
    shouldRefresh?: boolean;
  } | null>(null);

  useEffect(() => {
    const flashMessage = consumeAdminFlashMessage(`tournament-stages:${tournamentId}`);

    if (flashMessage) {
      setFeedbackModal(flashMessage);
    }
  }, [tournamentId]);

  const filteredStages = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? stages
      : stages.filter((stage) => {
          return (
            stage.stageName.toLowerCase().includes(term) ||
            formatStageType(stage.stageType).toLowerCase().includes(term) ||
            String(stage.sequence).includes(term)
          );
        });

    return sortRows(
      rows,
      (stage) => {
        switch (sortKey) {
          case "stageName":
            return stage.stageName;
          case "stageType":
            return formatStageType(stage.stageType);
          case "roundsCount":
            return stage.roundsCount;
          case "matchesCount":
            return stage.matchesCount;
          case "sequence":
          default:
            return stage.sequence;
        }
      },
      sortDirection
    );
  }, [stages, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const openSingleDeleteModal = (stage: StageRow) => {
    setStageToDelete(stage);
  };

  const closeSingleDeleteModal = () => {
    if (deletingSingle) return;
    setStageToDelete(null);
  };

  const confirmSingleDelete = async () => {
    if (!stageToDelete) return;

    try {
      setDeletingSingle(true);

      const res = await fetch(`/api/tournaments/stages/${stageToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament stage."
        );
      }

      setStageToDelete(null);
      setFeedbackModal({
        title: "Delete Stage Complete",
        message: `${stageToDelete.stageName} was deleted successfully.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setStageToDelete(null);
      setFeedbackModal({
        title: "Could not delete stage",
        message: err instanceof Error ? err.message : "Failed to delete tournament stage.",
      });
    } finally {
      setDeletingSingle(false);
    }
  };

  return (
    <>
      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search stages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <Link
            href={`/admin/tournaments/${tournamentId}/stages/new`}
            className="admin-toolbar-button admin-toolbar-button-add"
          >
            <FiPlus />
            <span>Add Stage</span>
          </Link>
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <SortableHeader
                  label="Stage Name"
                  columnKey="stageName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Type"
                  columnKey="stageType"
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
                  label="Rounds"
                  columnKey="roundsCount"
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
              {filteredStages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-players-empty">
                    No stages found for {tournamentName}.
                  </td>
                </tr>
              ) : (
                filteredStages.map((stage) => (
                  <tr key={stage.id}>
                    <td>
                      <Link
                        href={`/admin/tournaments/${tournamentId}/stages/${stage.id}/edit`}
                        className="admin-player-full-name"
                      >
                        {stage.stageName}
                      </Link>
                    </td>
                    <td>{formatStageType(stage.stageType)}</td>
                    <td>{stage.sequence}</td>
                    <td>{stage.roundsCount}</td>
                    <td>{stage.matchesCount}</td>
                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/tournaments/${tournamentId}/stages/${stage.id}/edit`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${stage.stageName}`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>

                        <Link
                            href={`/admin/tournaments/${tournamentId}/stages/${stage.id}/rounds`}
                            className="admin-icon-action admin-icon-action-navigate"
                            aria-label={`Manage rounds for ${stage.stageName}`}
                            title="Rounds"
                            >
                            <FiFolder />
                        </Link>

                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          aria-label={`Delete ${stage.stageName}`}
                          title="Delete"
                          onClick={() => openSingleDeleteModal(stage)}
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

      {stageToDelete && (
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
            aria-labelledby="single-delete-stage-title"
          >
            <h2 id="single-delete-stage-title" className="admin-modal-title">
              Delete stage?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete <strong>{stageToDelete.stageName}</strong>
              from this tournament.
            </p>

            <p className="admin-modal-text">
              This action cannot be undone.
            </p>

            <p className="admin-modal-text">
              This delete will only succeed after any related rounds and matches have
              already been removed.
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
                {deletingSingle ? "Deleting..." : "Delete Stage"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            aria-labelledby="stages-feedback-title"
          >
            <h2 id="stages-feedback-title" className="admin-modal-title">
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