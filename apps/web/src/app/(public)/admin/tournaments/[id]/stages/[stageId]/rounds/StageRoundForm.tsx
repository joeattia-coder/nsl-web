"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FiPlusCircle, FiSave, FiTrash2, FiX } from "react-icons/fi";

type StageRoundType = "GROUP" | "KNOCKOUT";
type SnookerFormat = "REDS_6" | "REDS_10" | "REDS_15";

type StageRoundFormProps = {
  mode: "create" | "edit";
  tournamentId: string;
  stageId: string;
  stageName: string;
  roundId?: string;
  initialData: {
    roundName: string;
    roundType: StageRoundType;
    sequence: number;
    matchesPerPairing: number;
    bestOfFrames: number;
    snookerFormat: SnookerFormat;
    groupCount?: number | null;
    playersPerGroup?: number | null;
    advancePerGroup?: number | null;
  };
};

const roundTypeOptions: Array<{
  value: StageRoundType;
  label: string;
}> = [
  { value: "GROUP", label: "Group" },
  { value: "KNOCKOUT", label: "Knockout" },
];

const snookerFormatOptions: Array<{ value: SnookerFormat; label: string }> = [
  { value: "REDS_6", label: "6 Reds" },
  { value: "REDS_10", label: "10 Reds" },
  { value: "REDS_15", label: "15 Reds (Full Rack)" },
];

export default function StageRoundForm({
  mode,
  tournamentId,
  stageId,
  roundId,
  initialData,
}: StageRoundFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [roundName, setRoundName] = useState(initialData.roundName);
  const [roundType, setRoundType] = useState<StageRoundType>(
    initialData.roundType
  );
  const [sequence, setSequence] = useState(String(initialData.sequence));
  const [matchesPerPairing, setMatchesPerPairing] = useState(
    String(initialData.matchesPerPairing)
  );
  const [bestOfFrames, setBestOfFrames] = useState(
    String(initialData.bestOfFrames)
  );
  const [snookerFormat, setSnookerFormat] = useState<SnookerFormat>(
    initialData.snookerFormat
  );
  const [groupCount, setGroupCount] = useState(
    initialData.groupCount ? String(initialData.groupCount) : ""
  );
  const [playersPerGroup, setPlayersPerGroup] = useState(
    initialData.playersPerGroup ? String(initialData.playersPerGroup) : ""
  );
  const [advancePerGroup, setAdvancePerGroup] = useState(
    initialData.advancePerGroup ? String(initialData.advancePerGroup) : ""
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGroupRound = roundType === "GROUP";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedRoundName = roundName.trim();
    const parsedSequence = Number(sequence);
    const parsedMatchesPerPairing = Number(matchesPerPairing);
    const parsedBestOfFrames = Number(bestOfFrames);

    if (!trimmedRoundName) {
      setError("Round name is required.");
      return;
    }

    if (!Number.isInteger(parsedSequence) || parsedSequence < 1) {
      setError("Sequence must be a whole number greater than or equal to 1.");
      return;
    }

    if (
      !Number.isInteger(parsedMatchesPerPairing) ||
      parsedMatchesPerPairing < 1
    ) {
      setError(
        "Matches per pairing must be a whole number greater than or equal to 1."
      );
      return;
    }

    if (
      !Number.isInteger(parsedBestOfFrames) ||
      parsedBestOfFrames < 1 ||
      parsedBestOfFrames % 2 === 0
    ) {
      setError("Best of frames must be an odd whole number (for example 3, 5, or 7).");
      return;
    }

    let parsedGroupCount: number | null = null;
    let parsedPlayersPerGroup: number | null = null;
    let parsedAdvancePerGroup: number | null = null;

    if (isGroupRound) {
      parsedGroupCount = Number(groupCount);
      parsedPlayersPerGroup = Number(playersPerGroup);

      if (!Number.isInteger(parsedGroupCount) || parsedGroupCount < 1) {
        setError("Number of groups must be a whole number greater than or equal to 1.");
        return;
      }

      if (
        !Number.isInteger(parsedPlayersPerGroup) ||
        parsedPlayersPerGroup < 1
      ) {
        setError(
          "Players per group must be a whole number greater than or equal to 1."
        );
        return;
      }

      if (advancePerGroup.trim()) {
        parsedAdvancePerGroup = Number(advancePerGroup);

        if (
          !Number.isInteger(parsedAdvancePerGroup) ||
          parsedAdvancePerGroup < 1
        ) {
          setError(
            "Advance per group must be a whole number greater than or equal to 1."
          );
          return;
        }

        if (parsedAdvancePerGroup > parsedPlayersPerGroup) {
          setError("Advance per group cannot be greater than players per group.");
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        roundName: trimmedRoundName,
        roundType,
        sequence: parsedSequence,
        matchesPerPairing: parsedMatchesPerPairing,
        bestOfFrames: parsedBestOfFrames,
        snookerFormat,
        groupCount: isGroupRound ? parsedGroupCount : null,
        playersPerGroup: isGroupRound ? parsedPlayersPerGroup : null,
        advancePerGroup: isGroupRound ? parsedAdvancePerGroup : null,
      };

      const res = await fetch(
        isEdit
          ? `/api/tournaments/rounds/${roundId}`
          : `/api/tournaments/stages/${stageId}/rounds`,
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
              ? "Failed to update stage round."
              : "Failed to create stage round.")
        );
      }

      router.push(`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update stage round."
            : "Failed to create stage round."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!roundId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this round?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      const res = await fetch(`/api/tournaments/rounds/${roundId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete stage round."
        );
      }

      router.push(`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to delete stage round."
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
            <label htmlFor="roundName" className="admin-label">
              Round Name
            </label>
            <input
              id="roundName"
              type="text"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              className="admin-input admin-player-form-input"
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="roundType" className="admin-label">
              Round Type
            </label>
            <select
              id="roundType"
              value={roundType}
              onChange={(e) => setRoundType(e.target.value as StageRoundType)}
              className="admin-select admin-player-form-input"
              required
            >
              {roundTypeOptions.map((option) => (
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

          <div className="admin-form-field">
            <label htmlFor="matchesPerPairing" className="admin-label">
              Matches Per Pairing
            </label>
            <input
              id="matchesPerPairing"
              type="number"
              min={1}
              step={1}
              value={matchesPerPairing}
              onChange={(e) => setMatchesPerPairing(e.target.value)}
              className="admin-input admin-player-form-input"
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="bestOfFrames" className="admin-label">
              Match Format (Best Of)
            </label>
            <input
              id="bestOfFrames"
              type="number"
              min={1}
              step={2}
              value={bestOfFrames}
              onChange={(e) => setBestOfFrames(e.target.value)}
              className="admin-input admin-player-form-input"
              required
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="snookerFormat" className="admin-label">
              Number of Reds
            </label>
            <select
              id="snookerFormat"
              value={snookerFormat}
              onChange={(e) => setSnookerFormat(e.target.value as SnookerFormat)}
              className="admin-select admin-player-form-input"
              required
            >
              {snookerFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isGroupRound ? (
            <>
              <div className="admin-form-field">
                <label htmlFor="groupCount" className="admin-label">
                  Number of Groups
                </label>
                <input
                  id="groupCount"
                  type="number"
                  min={1}
                  step={1}
                  value={groupCount}
                  onChange={(e) => setGroupCount(e.target.value)}
                  className="admin-input admin-player-form-input"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="playersPerGroup" className="admin-label">
                  Players Per Group
                </label>
                <input
                  id="playersPerGroup"
                  type="number"
                  min={1}
                  step={1}
                  value={playersPerGroup}
                  onChange={(e) => setPlayersPerGroup(e.target.value)}
                  className="admin-input admin-player-form-input"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="advancePerGroup" className="admin-label">
                  Advance Per Group
                </label>
                <input
                  id="advancePerGroup"
                  type="number"
                  min={1}
                  step={1}
                  value={advancePerGroup}
                  onChange={(e) => setAdvancePerGroup(e.target.value)}
                  className="admin-input admin-player-form-input"
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="admin-form-actions admin-player-form-actions">
          <Link
            href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds`}
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
              <span>{deleting ? "Deleting..." : "Delete Round"}</span>
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
                  : "Save Round"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}