import Link from "next/link";
import { redirect } from "next/navigation";
import PlayerPortalHeader from "@/app/(public)/PlayerPortalHeader";
import {
  getMatchResultSubmissionFrames,
  getPendingMatchResultSubmissionForMatch,
} from "@/lib/match-result-submission-store";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { getPlayerMatchAccessContext } from "@/lib/player-match-access";
import { formatDateTimeLocalValue, formatStoredMatchDateTimeLocalValue } from "@/lib/timezone";
import MyMatchResultForm from "./MyMatchResultForm";

export default async function MyMatchResultEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/my-matches");
  }

  if (!currentUser.linkedPlayerId) {
    redirect("/my-matches");
  }

  const { id } = await params;
  const accessContext = await getPlayerMatchAccessContext(id, currentUser.linkedPlayerId);

  if (!accessContext) {
    redirect("/my-matches");
  }

  const pendingSubmission = await getPendingMatchResultSubmissionForMatch(id);
  const isAwaitingCurrentPlayerReview = pendingSubmission?.targetEntryId === accessContext.currentEntry.id;
  const isCurrentPlayerSubmission = pendingSubmission?.submittedByEntryId === accessContext.currentEntry.id;
  const pendingFrames = isCurrentPlayerSubmission
    ? await getMatchResultSubmissionFrames(pendingSubmission.id)
    : [];
  const bestOfFrames = accessContext.match.bestOfFrames ?? 5;

  if (isAwaitingCurrentPlayerReview) {
    return (
      <section className="admin-page login-page-shell player-dashboard-page player-profile-page">
        <div className="login-page-card player-portal-shell player-dashboard-card">
          <PlayerPortalHeader
            kicker="My Matches"
            title="Review pending opponent result"
            subtitle="Your opponent has already submitted a result for this match. Approve or dispute it from My Matches."
            avatarLabel={currentUser.displayName}
          />

          <div className="player-portal-content player-portal-content-wide">
            <p className="login-form-status login-form-status-info">
              A pending submission already exists for {accessContext.homeEntry.label} vs {accessContext.awayEntry.label}.
            </p>
            <Link href="/my-matches" className="admin-player-form-button admin-player-form-button-secondary">
              Back to My Matches
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const homeHighBreaks = Array.from({ length: bestOfFrames }, (_, index) => {
    const frame = pendingFrames[index];
    return frame?.homeHighBreak !== null && frame?.homeHighBreak !== undefined
      ? String(frame.homeHighBreak)
      : "";
  });
  const awayHighBreaks = Array.from({ length: bestOfFrames }, (_, index) => {
    const frame = pendingFrames[index];
    return frame?.awayHighBreak !== null && frame?.awayHighBreak !== undefined
      ? String(frame.awayHighBreak)
      : "";
  });

  return (
    <section className="admin-page login-page-shell player-dashboard-page player-profile-page">
      <div className="login-page-card player-portal-shell player-dashboard-card">
        <PlayerPortalHeader
          kicker="My Matches"
          title="Submit your match result"
          subtitle="Enter the agreed result details. Your opponent will receive an email asking them to approve or dispute the submission."
          avatarLabel={currentUser.displayName}
        />

        <div className="player-portal-content player-portal-content-wide">
          <p className="my-match-meta">
            <strong>{accessContext.match.tournamentName}</strong>
            <span>{accessContext.match.roundName}</span>
          </p>
          <p className="my-match-teams">
            {accessContext.homeEntry.label}
            <span className="my-match-score">vs</span>
            {accessContext.awayEntry.label}
          </p>

          <MyMatchResultForm
            matchId={accessContext.match.id}
            homeEntry={{ id: accessContext.homeEntry.id, label: accessContext.homeEntry.label }}
            awayEntry={{ id: accessContext.awayEntry.id, label: accessContext.awayEntry.label }}
            hasExistingPendingSubmission={Boolean(isCurrentPlayerSubmission)}
            initialData={{
              startDateTime: isCurrentPlayerSubmission
                ? formatStoredMatchDateTimeLocalValue(
                    pendingSubmission.proposedMatchDate,
                    pendingSubmission.proposedMatchTime
                  )
                : formatStoredMatchDateTimeLocalValue(accessContext.match.matchDate, accessContext.match.matchTime),
              endDateTime: isCurrentPlayerSubmission
                ? formatDateTimeLocalValue(pendingSubmission.proposedEndedAt)
                : formatDateTimeLocalValue(accessContext.match.resultSubmittedAt),
              homeScore: isCurrentPlayerSubmission ? pendingSubmission.homeScore : accessContext.match.homeScore,
              awayScore: isCurrentPlayerSubmission ? pendingSubmission.awayScore : accessContext.match.awayScore,
              winnerEntryId: isCurrentPlayerSubmission ? pendingSubmission.winnerEntryId : null,
              bestOfFrames,
              homeHighBreaks,
              awayHighBreaks,
              summaryNote: isCurrentPlayerSubmission ? pendingSubmission.summaryNote ?? "" : "",
            }}
          />
        </div>
      </div>
    </section>
  );
}