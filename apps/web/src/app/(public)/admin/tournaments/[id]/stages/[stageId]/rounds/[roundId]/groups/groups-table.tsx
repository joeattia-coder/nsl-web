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
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

type GroupRow = {
  id: string;
  groupName: string;
  sequence: number;
  assignedCount: number;
  capacity: number;
};

type GroupsTableProps = {
  tournamentId: string;
  stageId: string;
  roundId: string;
  roundName: string;
  existingMatchCount: number;
  groups: GroupRow[];
};

type SortKey = "groupName" | "sequence" | "assignedCount";

type GenerateMatchesResponse = {
  createdCount?: number;
  details?: string;
  error?: string;
};

export default function GroupsTable({
  tournamentId,
  stageId,
  roundId,
  roundName,
  existingMatchCount,
  groups,
}: GroupsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sequence");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [addingGroup, setAddingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [deletingMatches, setDeletingMatches] = useState(false);
  const [deletingGroups, setDeletingGroups] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupRow | null>(null);
  const [showGenerateMatchesModal, setShowGenerateMatchesModal] = useState(false);
  const [showDeleteMatchesModal, setShowDeleteMatchesModal] = useState(false);
  const [showDeleteGroupsModal, setShowDeleteGroupsModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
    shouldRefresh?: boolean;
  } | null>(null);

  useEffect(() => {
    const flashMessage = consumeAdminFlashMessage(`round-groups:${roundId}`);

    if (flashMessage) {
      setFeedbackModal(flashMessage);
    }
  }, [roundId]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? groups
      : groups.filter((group) => {
          return (
            group.groupName.toLowerCase().includes(term) ||
            String(group.sequence).includes(term)
          );
        });

    return sortRows(
      rows,
      (group) => {
        switch (sortKey) {
          case "groupName":
            return group.groupName;
          case "assignedCount":
            return group.assignedCount;
          case "sequence":
          default:
            return group.sequence;
        }
      },
      sortDirection
    );
  }, [groups, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  async function handleAddGroup() {
    try {
      setAddingGroup(true);

      const res = await fetch(`/api/tournaments/rounds/${roundId}/groups`, {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to add group.");
      }

      setFeedbackModal({
        title: "Add Group Complete",
        message: `${data?.groupName ?? "The new group"} was added successfully to ${roundName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setFeedbackModal({
        title: "Could not add group",
        message: err instanceof Error ? err.message : "Failed to add group.",
      });
    } finally {
      setAddingGroup(false);
    }
  }

  function openDeleteModal(group: GroupRow) {
    setGroupToDelete(group);
  }

  function closeDeleteModal() {
    if (deletingGroupId) return;
    setGroupToDelete(null);
  }

  async function handleDeleteGroup() {
    if (!groupToDelete) return;

    try {
      setDeletingGroupId(groupToDelete.id);

      const res = await fetch(`/api/tournaments/groups/${groupToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete group."
        );
      }

      setGroupToDelete(null);
      setFeedbackModal({
        title: "Delete Group Complete",
        message: `${groupToDelete.groupName} was deleted successfully.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setGroupToDelete(null);
      setFeedbackModal({
        title: "Could not delete group",
        message: err instanceof Error ? err.message : "Failed to delete group.",
      });
    } finally {
      setDeletingGroupId(null);
    }
  }

  function openGenerateMatchesModal() {
    if (existingMatchCount > 0) {
      setFeedbackModal({
        title: "Matches already generated",
        message: `This round already has ${existingMatchCount} generated match${existingMatchCount === 1 ? "" : "es"}. Delete the existing matches before generating them again.`,
      });
      return;
    }

    setShowGenerateMatchesModal(true);
  }

  function closeGenerateMatchesModal() {
    if (generatingMatches) return;
    setShowGenerateMatchesModal(false);
  }

  function openDeleteMatchesModal() {
    setShowDeleteMatchesModal(true);
  }

  function closeDeleteMatchesModal() {
    if (deletingMatches) return;
    setShowDeleteMatchesModal(false);
  }

  function openDeleteGroupsModal() {
    setShowDeleteGroupsModal(true);
  }

  function closeDeleteGroupsModal() {
    if (deletingGroups) return;
    setShowDeleteGroupsModal(false);
  }

  async function handleGenerateMatches() {
    try {
      setGeneratingMatches(true);

      const res = await fetch(
        `/api/tournaments/rounds/${roundId}/generate-group-matches`,
        {
          method: "POST",
        }
      );

      const rawText = await res.text();

      let data: GenerateMatchesResponse | null = null;
      try {
        data = rawText ? (JSON.parse(rawText) as GenerateMatchesResponse) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const message = [
          `HTTP ${res.status}`,
          data?.details,
          data?.error,
          rawText && !data ? rawText.slice(0, 500) : "",
        ]
          .filter(Boolean)
          .join(" | ");

        setFeedbackModal({
          title: "Could not generate matches",
          message: message || "Failed to generate matches.",
        });
        return;
      }

      setShowGenerateMatchesModal(false);
      setFeedbackModal({
        title: "Generate Matches Complete",
        message: `Generated ${data?.createdCount ?? 0} matches for ${roundName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      setFeedbackModal({
        title: "Could not generate matches",
        message:
          err instanceof Error ? err.message : "Failed to generate matches.",
      });
    } finally {
      setGeneratingMatches(false);
    }
  }

  async function handleDeleteRoundMatches() {
    try {
      setDeletingMatches(true);

      const res = await fetch(`/api/tournaments/rounds/${roundId}/matches`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete round matches."
        );
      }

      setShowDeleteMatchesModal(false);
      setFeedbackModal({
        title: "Delete Matches Complete",
        message: `Deleted ${data?.deletedCount ?? 0} match${data?.deletedCount === 1 ? "" : "es"} from ${roundName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setShowDeleteMatchesModal(false);
      setFeedbackModal({
        title: "Could not delete matches",
        message:
          err instanceof Error ? err.message : "Failed to delete round matches.",
      });
    } finally {
      setDeletingMatches(false);
    }
  }

  async function handleDeleteAllGroups() {
    try {
      setDeletingGroups(true);

      const res = await fetch(`/api/tournaments/rounds/${roundId}/groups`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete groups."
        );
      }

      setShowDeleteGroupsModal(false);
      setFeedbackModal({
        title: "Delete All Groups Complete",
        message: `Deleted ${data?.deletedCount ?? 0} group${data?.deletedCount === 1 ? "" : "s"} from ${roundName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setShowDeleteGroupsModal(false);
      setFeedbackModal({
        title: "Could not delete groups",
        message: err instanceof Error ? err.message : "Failed to delete groups.",
      });
    } finally {
      setDeletingGroups(false);
    }
  }

  return (
    <>
      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <button
            type="button"
            className="admin-toolbar-button admin-toolbar-button-add"
            onClick={handleAddGroup}
            disabled={addingGroup || generatingMatches || deletingMatches || deletingGroups}
          >
            <FiPlus />
            <span>{addingGroup ? "Adding..." : "Add Group"}</span>
          </button>

          <button
            type="button"
            className="admin-toolbar-button admin-toolbar-button-import"
            onClick={openGenerateMatchesModal}
            disabled={generatingMatches || addingGroup || deletingMatches || deletingGroups}
          >
            <span>{generatingMatches ? "Generating..." : "Generate Matches"}</span>
          </button>

          <button
            type="button"
            className="admin-toolbar-button admin-toolbar-button-danger"
            onClick={openDeleteMatchesModal}
            disabled={existingMatchCount === 0 || generatingMatches || addingGroup || deletingMatches || deletingGroups}
          >
            <FiTrash2 />
            <span>{deletingMatches ? "Deleting..." : "Delete Matches"}</span>
          </button>

          <button
            type="button"
            className="admin-toolbar-button admin-toolbar-button-danger"
            onClick={openDeleteGroupsModal}
            disabled={groups.length === 0 || generatingMatches || addingGroup || deletingMatches || deletingGroups}
          >
            <FiTrash2 />
            <span>{deletingGroups ? "Deleting..." : "Delete All Groups"}</span>
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
                  label="Sequence"
                  columnKey="sequence"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Assigned"
                  columnKey="assignedCount"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-players-empty">
                    No groups found for {roundName}.
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.id}>
                    <td>
                      <Link
                        href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}/groups/${group.id}`}
                        className="admin-player-full-name"
                      >
                        {group.groupName}
                      </Link>
                    </td>
                    <td>{group.sequence}</td>
                    <td>
                      {group.assignedCount} / {group.capacity}
                    </td>
                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}/groups/${group.id}`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Manage ${group.groupName}`}
                          title="Manage"
                        >
                          <FiEdit2 />
                        </Link>

                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          aria-label={`Delete ${group.groupName}`}
                          title="Delete"
                          onClick={() => openDeleteModal(group)}
                          disabled={deletingGroupId === group.id || generatingMatches || deletingMatches || deletingGroups}
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

      {groupToDelete ? (
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
            aria-labelledby="group-delete-title"
          >
            <h2 id="group-delete-title" className="admin-modal-title">
              Delete group?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete <strong>{groupToDelete.groupName}</strong>
              from <strong>{roundName}</strong>.
            </p>

            <p className="admin-modal-text">
              This action cannot be undone.
            </p>

            <p className="admin-modal-text">
              This delete will only succeed after assigned entries and generated matches
              for this group have already been removed.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingGroupId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleDeleteGroup}
                disabled={Boolean(deletingGroupId)}
              >
                {deletingGroupId ? "Deleting..." : "Delete Group"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showGenerateMatchesModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={closeGenerateMatchesModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-matches-title"
          >
            <h2 id="generate-matches-title" className="admin-modal-title">
              Generate matches?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will generate all scheduled matches for <strong>{roundName}</strong>.
            </p>

            <p className="admin-modal-text">
              Existing group assignments will be used to create the fixtures for this round.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeGenerateMatchesModal}
                disabled={generatingMatches}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleGenerateMatches}
                disabled={generatingMatches}
              >
                {generatingMatches ? "Generating..." : "Generate Matches"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteMatchesModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={closeDeleteMatchesModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-round-matches-title"
          >
            <h2 id="delete-round-matches-title" className="admin-modal-title">
              Delete round matches?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete all <strong>{existingMatchCount}</strong>{" "}
              generated match{existingMatchCount === 1 ? "" : "es"} for <strong>{roundName}</strong>.
            </p>

            <p className="admin-modal-text">
              This action cannot be undone.
            </p>

            <p className="admin-modal-text">
              This will also delete related frame results and match history. Use this
              before changing group assignments or deleting entries that are still
              referenced by this round.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeDeleteMatchesModal}
                disabled={deletingMatches}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleDeleteRoundMatches}
                disabled={deletingMatches}
              >
                {deletingMatches ? "Deleting..." : "Delete Matches"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteGroupsModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={closeDeleteGroupsModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-all-groups-title"
          >
            <h2 id="delete-all-groups-title" className="admin-modal-title">
              Delete all groups?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete all <strong>{groups.length}</strong>{" "}
              group{groups.length === 1 ? "" : "s"} from <strong>{roundName}</strong>.
            </p>

            <p className="admin-modal-text">
              This action cannot be undone.
            </p>

            <p className="admin-modal-text">
              This will also remove all group assignments in those groups. If generated
              matches still exist for this round, delete those matches first.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeDeleteGroupsModal}
                disabled={deletingGroups}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleDeleteAllGroups}
                disabled={deletingGroups}
              >
                {deletingGroups ? "Deleting..." : "Delete All Groups"}
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
            aria-labelledby="groups-feedback-title"
          >
            <h2 id="groups-feedback-title" className="admin-modal-title">
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