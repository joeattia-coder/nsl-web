"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiArrowLeft, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

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

export default function GroupsTable({
  tournamentId,
  stageId,
  roundId,
  roundName,
  existingMatchCount,
  groups,
}: GroupsTableProps) {
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupRow | null>(null);
  const [showGenerateMatchesModal, setShowGenerateMatchesModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;

    return groups.filter((group) => {
      return (
        group.groupName.toLowerCase().includes(term) ||
        String(group.sequence).includes(term)
      );
    });
  }, [groups, search]);

  async function handleAddGroup() {
    try {
      setAddingGroup(true);
      setActionError(null);

      const res = await fetch(`/api/tournaments/rounds/${roundId}/groups`, {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to add group.");
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : "Failed to add group.");
    } finally {
      setAddingGroup(false);
    }
  }

  function openDeleteModal(group: GroupRow) {
    setActionError(null);
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
      setActionError(null);

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
      window.location.reload();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete group."
      );
    } finally {
      setDeletingGroupId(null);
    }
  }

  function openGenerateMatchesModal() {
    setActionError(null);

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

  async function handleGenerateMatches() {
    try {
      setGeneratingMatches(true);
      setActionError(null);

      const res = await fetch(
        `/api/tournaments/rounds/${roundId}/generate-group-matches`,
        {
          method: "POST",
        }
      );

      const rawText = await res.text();

      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
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
        title: "Matches generated",
        message: `Generated ${data?.createdCount ?? 0} matches for ${roundName}.`,
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
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <Link
            href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds`}
            className="admin-toolbar-button admin-toolbar-button-cancel"
          >
            <FiArrowLeft />
            <span>Back to Rounds</span>
          </Link>

          <button
            type="button"
            className="admin-toolbar-button admin-toolbar-button-add"
            onClick={handleAddGroup}
            disabled={addingGroup || generatingMatches}
          >
            <FiPlus />
            <span>{addingGroup ? "Adding..." : "Add Group"}</span>
          </button>

          <button
            type="button"
            className="admin-toolbar-button admin-toolbar-button-import"
            onClick={openGenerateMatchesModal}
            disabled={generatingMatches || addingGroup}
          >
            <span>{generatingMatches ? "Generating..." : "Generate Matches"}</span>
          </button>
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Sequence</th>
                <th>Assigned</th>
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
                      <span className="admin-player-full-name">
                        {group.groupName}
                      </span>
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
                          disabled={deletingGroupId === group.id || generatingMatches}
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
              You are about to delete <strong>{groupToDelete.groupName}</strong>.
              This action cannot be undone.
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
                {deletingGroupId ? "Deleting..." : "Delete"}
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
              Generate group matches?
            </h2>

            <p className="admin-modal-text">
              Generate all matches for <strong>{roundName}</strong> now?
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
                {generatingMatches ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => setFeedbackModal(null)}
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
                  const shouldReload = feedbackModal.title === "Matches generated";
                  setFeedbackModal(null);
                  if (shouldReload) {
                    window.location.reload();
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