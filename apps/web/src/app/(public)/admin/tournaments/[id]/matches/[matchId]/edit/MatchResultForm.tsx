"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { setAdminFlashMessage } from "@/lib/admin-flash";
import { FiSave, FiX } from "react-icons/fi";

type MatchResultFormProps = {
  tournamentId: string;
  matchId: string;
  homeEntry: { id: string; label: string };
  awayEntry: { id: string; label: string };
  initialData: {
    startDateTime: string;
    endDateTime: string;
    homeScore: number | null;
    awayScore: number | null;
    winnerEntryId: string | null;
    matchStatus: string;
    bestOfFrames: number;
    homeHighBreaks: string[];
    awayHighBreaks: string[];
  };
};

const matchStatusOptions = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "POSTPONED",
  "CANCELLED",
  "FORFEIT",
  "ABANDONED",
] as const;

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MatchResultForm({
  tournamentId,
  matchId,
  homeEntry,
  awayEntry,
  initialData,
}: MatchResultFormProps) {
  const router = useRouter();

  const [homeScore, setHomeScore] = useState(
    initialData.homeScore === null ? "" : String(initialData.homeScore)
  );
  const [awayScore, setAwayScore] = useState(
    initialData.awayScore === null ? "" : String(initialData.awayScore)
  );
  const [startDateTime, setStartDateTime] = useState(initialData.startDateTime);
  const [endDateTime, setEndDateTime] = useState(initialData.endDateTime);
  const [winnerEntryId, setWinnerEntryId] = useState(
    initialData.winnerEntryId ?? ""
  );
  const [matchStatus, setMatchStatus] = useState(initialData.matchStatus);
  const [autoPickWinner, setAutoPickWinner] = useState(true);
  const [homeHighBreaks, setHomeHighBreaks] = useState(
    initialData.homeHighBreaks
  );
  const [awayHighBreaks, setAwayHighBreaks] = useState(
    initialData.awayHighBreaks
  );

  const [saving, setSaving] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const frameNumbers = Array.from(
    { length: initialData.bestOfFrames },
    (_, index) => index + 1
  );
  const framesNeededToWin = Math.floor(initialData.bestOfFrames / 2) + 1;

  function updateHighBreak(
    team: "home" | "away",
    frameIndex: number,
    value: string
  ) {
    if (team === "home") {
      setHomeHighBreaks((prev) =>
        prev.map((item, index) => (index === frameIndex ? value : item))
      );
      return;
    }

    setAwayHighBreaks((prev) =>
      prev.map((item, index) => (index === frameIndex ? value : item))
    );
  }

  function parseHighBreaks(values: string[], sideLabel: string) {
    return values.map((value, index) => {
      const trimmed = value.trim();
      if (trimmed === "") {
        return null;
      }

      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(
          `${sideLabel} high break for frame ${index + 1} must be a whole number greater than or equal to 0.`
        );
      }

      return parsed;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const parsedHomeScore = homeScore.trim() === "" ? null : Number(homeScore);
    const parsedAwayScore = awayScore.trim() === "" ? null : Number(awayScore);

    if (
      parsedHomeScore !== null &&
      (!Number.isInteger(parsedHomeScore) || parsedHomeScore < 0)
    ) {
      setFeedbackModal({
        title: "Invalid home score",
        message: "Home score must be a whole number greater than or equal to 0.",
      });
      return;
    }

    if (
      parsedAwayScore !== null &&
      (!Number.isInteger(parsedAwayScore) || parsedAwayScore < 0)
    ) {
      setFeedbackModal({
        title: "Invalid away score",
        message: "Away score must be a whole number greater than or equal to 0.",
      });
      return;
    }

    if (
      winnerEntryId &&
      winnerEntryId !== homeEntry.id &&
      winnerEntryId !== awayEntry.id
    ) {
      setFeedbackModal({
        title: "Invalid winner",
        message: "Winner must be either the home or away entry.",
      });
      return;
    }

    let parsedHomeHighBreaks: Array<number | null> = [];
    let parsedAwayHighBreaks: Array<number | null> = [];
    let effectiveWinnerEntryId = winnerEntryId || null;

    try {
      parsedHomeHighBreaks = parseHighBreaks(homeHighBreaks, homeEntry.label);
      parsedAwayHighBreaks = parseHighBreaks(awayHighBreaks, awayEntry.label);
    } catch (validationError) {
      setFeedbackModal({
        title: "Invalid high break values",
        message:
          validationError instanceof Error
            ? validationError.message
            : "Invalid frame high break values.",
      });
      return;
    }

    if (autoPickWinner) {
      if (
        parsedHomeScore !== null &&
        parsedAwayScore !== null &&
        parsedHomeScore >= framesNeededToWin &&
        parsedHomeScore > parsedAwayScore
      ) {
        effectiveWinnerEntryId = homeEntry.id;
      } else if (
        parsedHomeScore !== null &&
        parsedAwayScore !== null &&
        parsedAwayScore >= framesNeededToWin &&
        parsedAwayScore > parsedHomeScore
      ) {
        effectiveWinnerEntryId = awayEntry.id;
      }
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchDate:
            startDateTime.trim() === ""
              ? null
              : startDateTime.slice(0, 10),
          matchTime:
            startDateTime.trim() === ""
              ? null
              : startDateTime.slice(11, 16),
          resultSubmittedAt:
            endDateTime.trim() === "" ? null : new Date(endDateTime).toISOString(),
          homeScore: parsedHomeScore,
          awayScore: parsedAwayScore,
          winnerEntryId: effectiveWinnerEntryId,
          matchStatus,
          bestOfFrames: initialData.bestOfFrames,
          frameHighBreaks: {
            home: parsedHomeHighBreaks,
            away: parsedAwayHighBreaks,
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to update match result.");
      }

      setAdminFlashMessage(`tournament-matches:${tournamentId}`, {
        title: "Update Match Result Complete",
        message: `Match result for ${homeEntry.label} vs ${awayEntry.label} was updated successfully.`,
      });
      router.push(`/admin/tournaments/${tournamentId}/matches`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setFeedbackModal({
        title: "Could not update match result",
        message:
          err instanceof Error ? err.message : "Failed to update match result.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card admin-player-form-card">
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label htmlFor="startDateTime" className="admin-label">
              Match start date/time
            </label>
            <input
              id="startDateTime"
              type="datetime-local"
              className="admin-input admin-player-form-input"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="endDateTime" className="admin-label">
              Match end date/time
            </label>
            <input
              id="endDateTime"
              type="datetime-local"
              className="admin-input admin-player-form-input"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="homeScore" className="admin-label">
              {homeEntry.label} score
            </label>
            <input
              id="homeScore"
              type="number"
              min={0}
              step={1}
              className="admin-input admin-player-form-input"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="awayScore" className="admin-label">
              {awayEntry.label} score
            </label>
            <input
              id="awayScore"
              type="number"
              min={0}
              step={1}
              className="admin-input admin-player-form-input"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="winnerEntryId" className="admin-label">
              Winner
            </label>
            <select
              id="winnerEntryId"
              className="admin-select admin-player-form-input"
              value={winnerEntryId}
              onChange={(e) => setWinnerEntryId(e.target.value)}
            >
              <option value="">No winner selected</option>
              <option value={homeEntry.id}>{homeEntry.label}</option>
              <option value={awayEntry.id}>{awayEntry.label}</option>
            </select>
            <p className="admin-form-help-text">
              First to {framesNeededToWin} frames wins (best of {initialData.bestOfFrames}).
            </p>
          </div>

          <div className="admin-form-field">
            <label htmlFor="matchStatus" className="admin-label">
              Match status
            </label>
            <select
              id="matchStatus"
              className="admin-select admin-player-form-input"
              value={matchStatus}
              onChange={(e) => setMatchStatus(e.target.value)}
            >
              {matchStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-field">
            <label htmlFor="autoPickWinner" className="admin-label">
              Auto-set winner from score
            </label>
            <select
              id="autoPickWinner"
              className="admin-select admin-player-form-input"
              value={autoPickWinner ? "true" : "false"}
              onChange={(e) => setAutoPickWinner(e.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <div className="match-breaks-layout">
          <section className="admin-card match-breaks-panel">
            <h3 className="admin-page-subtitle match-breaks-title">
              {homeEntry.label}
            </h3>
            <div className="match-breaks-list">
              {frameNumbers.map((frameNumber, index) => (
                <div className="admin-form-field" key={`home-frame-${frameNumber}`}>
                  <label htmlFor={`homeHighBreak-${frameNumber}`} className="admin-label">
                    Frame {frameNumber} high break
                  </label>
                  <input
                    id={`homeHighBreak-${frameNumber}`}
                    type="number"
                    min={0}
                    step={1}
                    className="admin-input admin-player-form-input"
                    value={homeHighBreaks[index] ?? ""}
                    onChange={(e) => updateHighBreak("home", index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card match-breaks-panel">
            <h3 className="admin-page-subtitle match-breaks-title">
              {awayEntry.label}
            </h3>
            <div className="match-breaks-list">
              {frameNumbers.map((frameNumber, index) => (
                <div className="admin-form-field" key={`away-frame-${frameNumber}`}>
                  <label htmlFor={`awayHighBreak-${frameNumber}`} className="admin-label">
                    Frame {frameNumber} high break
                  </label>
                  <input
                    id={`awayHighBreak-${frameNumber}`}
                    type="number"
                    min={0}
                    step={1}
                    className="admin-input admin-player-form-input"
                    value={awayHighBreaks[index] ?? ""}
                    onChange={(e) => updateHighBreak("away", index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-form-actions">
          <Link
            href={`/admin/tournaments/${tournamentId}/matches`}
            className="admin-player-form-button admin-player-form-button-secondary"
          >
            <FiX />
            <span>Cancel</span>
          </Link>

          <button
            type="submit"
            className="admin-player-form-button admin-player-form-button-primary"
            disabled={saving}
          >
            <FiSave />
            <span>{saving ? "Saving..." : "Save Result"}</span>
          </button>
        </div>
      </form>

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
            aria-labelledby="match-result-feedback-title"
          >
            <h2 id="match-result-feedback-title" className="admin-modal-title">
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
