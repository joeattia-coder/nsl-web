"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiPlusCircle,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";

type SeasonOption = {
  id: string;
  seasonName: string;
};

type VenueOption = {
  id: string;
  venueName: string;
};

type TournamentParticipantType =
  | "Singles"
  | "Doubles"
  | "Triples"
  | "Teams";

type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type TournamentFormData = {
  id?: string;
  seasonId: string;
  venueId: string;
  tournamentName: string;
  participantType: TournamentParticipantType;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  isPublished: boolean;
  description: string;
};

type TournamentFormProps = {
  mode: "create" | "edit";
  seasons: SeasonOption[];
  venues: VenueOption[];
  initialData?: TournamentFormData;
};

const participantTypes: Array<{
  value: TournamentParticipantType;
  label: string;
}> = [
  { value: "Singles", label: "Singles" },
  { value: "Doubles", label: "Doubles" },
  { value: "Triples", label: "Triples" },
  { value: "Teams", label: "Teams" },
];

const statusOptions: Array<{
  value: TournamentStatus;
  label: string;
}> = [
  { value: "DRAFT", label: "Draft" },
  { value: "REGISTRATION_OPEN", label: "Registration Open" },
  { value: "REGISTRATION_CLOSED", label: "Registration Closed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function TournamentForm({
  mode,
  seasons,
  venues,
  initialData,
}: TournamentFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [seasonId, setSeasonId] = useState(initialData?.seasonId ?? "");
  const [venueId, setVenueId] = useState(initialData?.venueId ?? "");
  const [tournamentName, setTournamentName] = useState(
    initialData?.tournamentName ?? ""
  );
  const [participantType, setParticipantType] =
    useState<TournamentParticipantType>(
      initialData?.participantType ?? "Singles"
    );
  const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
  const [status, setStatus] = useState<TournamentStatus>(
    initialData?.status ?? "DRAFT"
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.isPublished ?? false
  );
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );

  const sortedVenues = useMemo(
    () =>
      [...venues].sort((left, right) =>
        left.venueName.localeCompare(right.venueName, undefined, {
          sensitivity: "base",
        })
      ),
    [venues]
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedTournamentName = tournamentName.trim();

    if (!seasonId) {
      setError("Please select a season.");
      return;
    }

    if (!trimmedTournamentName) {
      setError("Tournament name is required.");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be the same as or later than the start date.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        seasonId,
        venueId: venueId || null,
        tournamentName: trimmedTournamentName,
        participantType,
        startDate: startDate || null,
        endDate: endDate || null,
        status,
        isPublished,
        description: description.trim() || null,
      };

      const res = await fetch(
        isEdit ? `/api/tournaments/${initialData?.id}` : "/api/tournaments",
        {
          method: isEdit ? "PUT" : "POST",
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
              ? "Failed to update tournament."
              : "Failed to create tournament.")
        );
      }

      router.push("/admin/tournaments");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update tournament."
            : "Failed to create tournament."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this tournament?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      const res = await fetch(`/api/tournaments/${initialData.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament."
        );
      }

      router.push("/admin/tournaments");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to delete tournament."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEdit ? "Edit Tournament" : "Add Tournament"}
          </h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update tournament details, scheduling, status, and visibility."
              : "Create a new tournament and assign it to a season."}
          </p>
        </div>

        <Link
          href="/admin/tournaments"
          className="admin-player-form-button admin-player-form-button-secondary"
        >
          <FiArrowLeft />
          <span>Back to Tournaments</span>
        </Link>
      </div>

      <div className="admin-card admin-player-form-card">
        <form onSubmit={handleSubmit} className="admin-form">
          {error ? <p className="admin-form-error">{error}</p> : null}

          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label htmlFor="tournamentName" className="admin-label">
                Tournament Name
              </label>
              <input
                id="tournamentName"
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="admin-input admin-player-form-input"
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="seasonId" className="admin-label">
                Season
              </label>
              <select
                id="seasonId"
                value={seasonId}
                onChange={(e) => setSeasonId(e.target.value)}
                className="admin-select admin-player-form-input"
                required
              >
                <option value="">Select season</option>
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.seasonName}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="venueId" className="admin-label">
                Venue
              </label>
              <select
                id="venueId"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="admin-select admin-player-form-input"
              >
                <option value="">No venue assigned</option>
                {sortedVenues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.venueName}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="participantType" className="admin-label">
                Participant Type
              </label>
              <select
                id="participantType"
                value={participantType}
                onChange={(e) =>
                  setParticipantType(
                    e.target.value as TournamentParticipantType
                  )
                }
                className="admin-select admin-player-form-input"
                required
              >
                {participantTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="startDate" className="admin-label">
                Start Date
              </label>
              <input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="endDate" className="admin-label">
                End Date
              </label>
              <input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="status" className="admin-label">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                className="admin-select admin-player-form-input"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="isPublished" className="admin-label">
                Published
              </label>
              <select
                id="isPublished"
                value={isPublished ? "true" : "false"}
                onChange={(e) => setIsPublished(e.target.value === "true")}
                className="admin-select admin-player-form-input"
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="description" className="admin-label">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="admin-textarea admin-player-form-input"
                rows={6}
              />
            </div>
          </div>

          <div className="admin-form-actions admin-player-form-actions">
            <Link
              href="/admin/tournaments"
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
                <span>{deleting ? "Deleting..." : "Delete Tournament"}</span>
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
                    : "Save Tournament"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}