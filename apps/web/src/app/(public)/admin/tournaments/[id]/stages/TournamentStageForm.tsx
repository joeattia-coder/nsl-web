"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { setAdminFlashMessage } from "@/lib/admin-flash";
import { FiPlusCircle, FiSave, FiTrash2, FiX } from "react-icons/fi";

type TournamentStageType = "GROUP" | "KNOCKOUT";

type TournamentStageFormProps = {
  mode: "create" | "edit";
  tournamentId: string;
  tournamentName: string;
  stageId?: string;
  initialData: {
    stageName: string;
    stageType: TournamentStageType;
    sequence: number;
  };
};

const stageTypeOptions: Array<{
  value: TournamentStageType;
  label: string;
}> = [
  { value: "GROUP", label: "Group" },
  { value: "KNOCKOUT", label: "Knockout" },
];

export default function TournamentStageForm({
  mode,
  tournamentId,
  stageId,
  initialData,
}: TournamentStageFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [stageName, setStageName] = useState(initialData.stageName);
  const [stageType, setStageType] = useState<TournamentStageType>(
    initialData.stageType
  );
  const [sequence, setSequence] = useState(String(initialData.sequence));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedStageName = stageName.trim();
    const parsedSequence = Number(sequence);

    if (!trimmedStageName) {
      setFeedbackModal({
        title: "Stage name required",
        message: "Stage name is required.",
      });
      return;
    }

    if (!Number.isInteger(parsedSequence) || parsedSequence < 1) {
      setFeedbackModal({
        title: "Invalid sequence",
        message: "Sequence must be a whole number greater than or equal to 1.",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        stageName: trimmedStageName,
        stageType,
        sequence: parsedSequence,
      };

      const res = await fetch(
        isEdit
          ? `/api/tournaments/stages/${stageId}`
          : `/api/tournaments/${tournamentId}/stages`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            (isEdit
              ? "Failed to update tournament stage."
              : "Failed to create tournament stage.")
        );
      }

      setAdminFlashMessage(`tournament-stages:${tournamentId}`, {
        title: isEdit ? "Update Stage Complete" : "Create Stage Complete",
        message: `${trimmedStageName} was ${isEdit ? "updated" : "created"} successfully.`,
      });
      router.push(`/admin/tournaments/${tournamentId}/stages`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setFeedbackModal({
        title: isEdit ? "Could not update stage" : "Could not create stage",
        message:
          err instanceof Error
            ? err.message
            : isEdit
              ? "Failed to update tournament stage."
              : "Failed to create tournament stage.",
      });
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal() {
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDeleteModal(false);
  }

  async function handleDelete() {
    if (!stageId) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/tournaments/stages/${stageId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament stage."
        );
      }

      setShowDeleteModal(false);
      router.push(`/admin/tournaments/${tournamentId}/stages`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setShowDeleteModal(false);
      setFeedbackModal({
        title: "Could not delete stage",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete tournament stage.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-card admin-player-form-card">
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label htmlFor="stageName" className="admin-label">
              Stage Name
            </label>
            <input
              id="stageName"
              type="text"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="admin-input admin-player-form-input"
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="stageType" className="admin-label">
              Stage Type
            </label>
            <select
              id="stageType"
              value={stageType}
              onChange={(e) =>
                setStageType(e.target.value as TournamentStageType)
              }
              className="admin-select admin-player-form-input"
              required
            >
              {stageTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-field">
            <label htmlFor="sequence" className="admin-label">
              Sequence
            </label>
            <input
              id="sequence"
              type="number"
              min={1}
              step={1}
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              className="admin-input admin-player-form-input"
              required
            />
          </div>
        </div>

        <div className="admin-form-actions admin-player-form-actions">
          <Link
            href={`/admin/tournaments/${tournamentId}/stages`}
            className="admin-player-form-button admin-player-form-button-secondary"
          >
            <FiX />
            <span>Cancel</span>
          </Link>

          {isEdit ? (
            <button
              type="button"
              onClick={openDeleteModal}
              className="admin-player-form-button admin-toolbar-button-danger"
              disabled={deleting || saving}
            >
              <FiTrash2 />
              <span>{deleting ? "Deleting..." : "Delete Stage"}</span>
            </button>
          ) : null}

          <button
            type="submit"
            className={`admin-player-form-button ${
              isEdit
                ? "admin-player-form-button-primary"
                : "admin-player-form-button-create"
            }`}
            disabled={saving || deleting}
          >
            {isEdit ? <FiSave /> : <FiPlusCircle />}
            <span>
              {saving
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Save Stage"}
            </span>
          </button>
        </div>
      </form>

      {showDeleteModal ? (
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
            aria-labelledby="stage-delete-title"
          >
            <h2 id="stage-delete-title" className="admin-modal-title">
              Delete stage?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete <strong>{stageName}</strong>
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
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Stage"}
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
            aria-labelledby="stage-feedback-title"
          >
            <h2 id="stage-feedback-title" className="admin-modal-title">
              {feedbackModal.title}
            </h2>

            <p className="admin-modal-text">{feedbackModal.message}</p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => setFeedbackModal(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}