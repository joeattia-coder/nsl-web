"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MyMatchActionsProps = {
  matchId: string;
  editHref: string;
  mode: "none" | "submittedByYou" | "awaitingYourReview";
};

export default function MyMatchActions({ matchId, editHref, mode }: MyMatchActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ title: string; message: string } | null>(null);

  async function approveResult() {
    try {
      setIsApproving(true);

      const response = await fetch(`/api/my-matches/${matchId}/submission/approve`, {
        method: "POST",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to approve the submitted result.");
      }

      router.refresh();
    } catch (error) {
      setFeedbackModal({
        title: "Could not approve result",
        message: error instanceof Error ? error.message : "Failed to approve the submitted result.",
      });
    } finally {
      setIsApproving(false);
    }
  }

  async function disputeResult() {
    try {
      setIsDisputing(true);

      const response = await fetch(`/api/my-matches/${matchId}/submission/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disputeReason,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to dispute the submitted result.");
      }

      setShowDisputeModal(false);
      setDisputeReason("");
      router.refresh();
    } catch (error) {
      setFeedbackModal({
        title: "Could not dispute result",
        message: error instanceof Error ? error.message : "Failed to dispute the submitted result.",
      });
    } finally {
      setIsDisputing(false);
    }
  }

  return (
    <>
      <div className="my-match-actions">
        {mode === "none" ? (
          <Link href={editHref} className="admin-player-form-button admin-player-form-button-secondary">
            Submit result
          </Link>
        ) : null}

        {mode === "submittedByYou" ? (
          <Link href={editHref} className="admin-player-form-button admin-player-form-button-secondary">
            Edit pending submission
          </Link>
        ) : null}

        {mode === "awaitingYourReview" ? (
          <>
            <button
              type="button"
              className="admin-player-form-button admin-player-form-button-primary"
              disabled={isApproving}
              onClick={approveResult}
            >
              {isApproving ? "Approving..." : "Approve result"}
            </button>
            <button
              type="button"
              className="admin-player-form-button admin-player-form-button-secondary"
              onClick={() => setShowDisputeModal(true)}
            >
              Dispute result
            </button>
          </>
        ) : null}
      </div>

      {showDisputeModal ? (
        <div className="admin-modal-backdrop" onClick={() => setShowDisputeModal(false)} role="presentation">
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispute-result-title"
          >
            <h2 id="dispute-result-title" className="admin-modal-title">
              Dispute submitted result
            </h2>
            <p className="admin-modal-text">
              Explain what is wrong with the submitted result. This will be emailed to the league administrators.
            </p>
            <textarea
              className="admin-textarea"
              rows={5}
              maxLength={2000}
              value={disputeReason}
              onChange={(event) => setDisputeReason(event.target.value)}
            />
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => setShowDisputeModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-button admin-modal-button-danger"
                disabled={isDisputing}
                onClick={disputeResult}
              >
                {isDisputing ? "Sending..." : "Send dispute"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackModal ? (
        <div className="admin-modal-backdrop" onClick={() => setFeedbackModal(null)} role="presentation">
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-match-feedback-title"
          >
            <h2 id="my-match-feedback-title" className="admin-modal-title">
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
    </>
  );
}