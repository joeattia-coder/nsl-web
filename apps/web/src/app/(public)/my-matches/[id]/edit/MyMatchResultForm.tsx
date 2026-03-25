"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { FiSave, FiX } from "react-icons/fi";

type MyMatchResultFormProps = {
  matchId: string;
  homeEntry: { id: string; label: string };
  awayEntry: { id: string; label: string };
  hasExistingPendingSubmission: boolean;
  initialData: {
    startDateTime: string;
    endDateTime: string;
    homeScore: number | null;
    awayScore: number | null;
    winnerEntryId: string | null;
    bestOfFrames: number;
    homeHighBreaks: string[];
    awayHighBreaks: string[];
    summaryNote: string;
  };
};

export default function MyMatchResultForm({
  matchId,
  homeEntry,
  awayEntry,
  hasExistingPendingSubmission,
  initialData,
}: MyMatchResultFormProps) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(initialData.homeScore === null ? "" : String(initialData.homeScore));
  const [awayScore, setAwayScore] = useState(initialData.awayScore === null ? "" : String(initialData.awayScore));
  const [startDateTime, setStartDateTime] = useState(initialData.startDateTime);
  const [endDateTime, setEndDateTime] = useState(initialData.endDateTime);
  const [winnerEntryId, setWinnerEntryId] = useState(initialData.winnerEntryId ?? "");
  const [autoPickWinner, setAutoPickWinner] = useState(true);
  const [summaryNote, setSummaryNote] = useState(initialData.summaryNote);
  const [homeHighBreaks, setHomeHighBreaks] = useState(initialData.homeHighBreaks);
  const [awayHighBreaks, setAwayHighBreaks] = useState(initialData.awayHighBreaks);
  const [saving, setSaving] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ title: string; message: string } | null>(null);

  const frameNumbers = Array.from({ length: initialData.bestOfFrames }, (_, index) => index + 1);
  const framesNeededToWin = Math.floor(initialData.bestOfFrames / 2) + 1;

  function updateHighBreak(team: "home" | "away", frameIndex: number, value: string) {
    if (team === "home") {
      setHomeHighBreaks((current) => current.map((item, index) => (index === frameIndex ? value : item)));
      return;
    }

    setAwayHighBreaks((current) => current.map((item, index) => (index === frameIndex ? value : item)));
  }

  function parseHighBreaks(values: string[], sideLabel: string) {
    return values.map((value, index) => {
      const trimmed = value.trim();

      if (!trimmed) {
        return null;
      }

      const parsed = Number(trimmed);

      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`${sideLabel} high break for frame ${index + 1} must be a whole number greater than or equal to 0.`);
      }

      return parsed;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedHomeScore = homeScore.trim() === "" ? null : Number(homeScore);
    const parsedAwayScore = awayScore.trim() === "" ? null : Number(awayScore);

    if (parsedHomeScore === null || !Number.isInteger(parsedHomeScore) || parsedHomeScore < 0) {
      setFeedbackModal({
        title: "Invalid home score",
        message: "Home score must be a whole number greater than or equal to 0.",
      });
      return;
    }

    if (parsedAwayScore === null || !Number.isInteger(parsedAwayScore) || parsedAwayScore < 0) {
      setFeedbackModal({
        title: "Invalid away score",
        message: "Away score must be a whole number greater than or equal to 0.",
      });
      return;
    }

    let effectiveWinnerEntryId = winnerEntryId || null;

    if (autoPickWinner) {
      if (parsedHomeScore >= framesNeededToWin && parsedHomeScore > parsedAwayScore) {
        effectiveWinnerEntryId = homeEntry.id;
      } else if (parsedAwayScore >= framesNeededToWin && parsedAwayScore > parsedHomeScore) {
        effectiveWinnerEntryId = awayEntry.id;
      }
    }

    if (
      effectiveWinnerEntryId !== null &&
      effectiveWinnerEntryId !== homeEntry.id &&
      effectiveWinnerEntryId !== awayEntry.id
    ) {
      setFeedbackModal({
        title: "Invalid winner",
        message: "Winner must be either the home or away entry.",
      });
      return;
    }

    let parsedHomeHighBreaks: Array<number | null> = [];
    let parsedAwayHighBreaks: Array<number | null> = [];

    try {
      parsedHomeHighBreaks = parseHighBreaks(homeHighBreaks, homeEntry.label);
      parsedAwayHighBreaks = parseHighBreaks(awayHighBreaks, awayEntry.label);
    } catch (validationError) {
      setFeedbackModal({
        title: "Invalid high break values",
        message: validationError instanceof Error ? validationError.message : "Invalid frame high break values.",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/my-matches/${matchId}/submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDateTime: startDateTime.trim() || null,
          endDateTime: endDateTime.trim() || null,
          homeScore: parsedHomeScore,
          awayScore: parsedAwayScore,
          winnerEntryId: effectiveWinnerEntryId,
          homeHighBreaks: parsedHomeHighBreaks,
          awayHighBreaks: parsedAwayHighBreaks,
          summaryNote: summaryNote.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit the match result.");
      }

      router.push("/my-matches");
      router.refresh();
    } catch (error) {
      setFeedbackModal({
        title: "Could not submit match result",
        message: error instanceof Error ? error.message : "Failed to submit the match result.",
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
              onChange={(event) => setStartDateTime(event.target.value)}
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
              onChange={(event) => setEndDateTime(event.target.value)}
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
              onChange={(event) => setHomeScore(event.target.value)}
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
              onChange={(event) => setAwayScore(event.target.value)}
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
              onChange={(event) => setWinnerEntryId(event.target.value)}
            >
              <option value="">Auto-detect from score</option>
              <option value={homeEntry.id}>{homeEntry.label}</option>
              <option value={awayEntry.id}>{awayEntry.label}</option>
            </select>
            <p className="admin-form-help-text">
              First to {framesNeededToWin} frames wins (best of {initialData.bestOfFrames}).
            </p>
          </div>

          <div className="admin-form-field">
            <label htmlFor="autoPickWinner" className="admin-label">
              Auto-set winner from score
            </label>
            <select
              id="autoPickWinner"
              className="admin-select admin-player-form-input"
              value={autoPickWinner ? "true" : "false"}
              onChange={(event) => setAutoPickWinner(event.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="admin-form-field admin-form-field-full-width">
            <label htmlFor="summaryNote" className="admin-label">
              Notes for your opponent
            </label>
            <textarea
              id="summaryNote"
              className="admin-textarea admin-player-form-input"
              rows={4}
              maxLength={1000}
              value={summaryNote}
              onChange={(event) => setSummaryNote(event.target.value)}
            />
            <p className="admin-form-help-text">
              Optional context to include with the result submission.
            </p>
          </div>
        </div>

        <div className="match-breaks-layout">
          <section className="admin-card match-breaks-panel">
            <h3 className="admin-page-subtitle match-breaks-title">{homeEntry.label}</h3>
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
                    onChange={(event) => updateHighBreak("home", index, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card match-breaks-panel">
            <h3 className="admin-page-subtitle match-breaks-title">{awayEntry.label}</h3>
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
                    onChange={(event) => updateHighBreak("away", index, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-form-actions">
          <Link href="/my-matches" className="admin-player-form-button admin-player-form-button-secondary">
            <FiX />
            <span>Cancel</span>
          </Link>

          <button
            type="submit"
            className="admin-player-form-button admin-player-form-button-primary"
            disabled={saving}
          >
            <FiSave />
            <span>
              {saving
                ? "Submitting..."
                : hasExistingPendingSubmission
                  ? "Update Submitted Result"
                  : "Submit Result"}
            </span>
          </button>
        </div>
      </form>

      {feedbackModal ? (
        <div className="admin-modal-backdrop" onClick={() => setFeedbackModal(null)} role="presentation">
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-match-result-feedback-title"
          >
            <h2 id="player-match-result-feedback-title" className="admin-modal-title">
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