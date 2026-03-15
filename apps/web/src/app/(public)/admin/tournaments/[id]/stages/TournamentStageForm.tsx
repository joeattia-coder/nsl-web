"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedStageName = stageName.trim();
    const parsedSequence = Number(sequence);

    if (!trimmedStageName) {
      setError("Stage name is required.");
      return;
    }

    if (!Number.isInteger(parsedSequence) || parsedSequence < 1) {
      setError("Sequence must be a whole number greater than or equal to 1.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

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

      router.push(`/admin/tournaments/${tournamentId}/stages`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update tournament stage."
            : "Failed to create tournament stage."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!stageId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this stage?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      const res = await fetch(`/api/tournaments/stages/${stageId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament stage."
        );
      }

      router.push(`/admin/tournaments/${tournamentId}/stages`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to delete tournament stage."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-card admin-player-form-card">
      <form onSubmit={handleSubmit} className="admin-form">
        {error ? <p className="admin-form-error">{error}</p> : null}

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
              onClick={handleDelete}
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
    </div>
  );
}