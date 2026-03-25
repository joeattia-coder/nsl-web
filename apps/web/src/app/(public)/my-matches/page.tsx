import Link from "next/link";
import { redirect } from "next/navigation";
import LocalTimeText from "@/components/LocalTimeText";
import { getPendingMatchResultSubmissionsForMatches } from "@/lib/match-result-submission-store";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseStoredMatchDateTime } from "@/lib/timezone";
import MyMatchActions from "./MyMatchActions";
import PlayerPortalHeader from "../PlayerPortalHeader";

function formatEntryName(members: Array<{ player: { firstName: string; lastName: string } }>) {
  const names = members.map((member) => `${member.player.firstName} ${member.player.lastName}`.trim());

  if (names.length === 0) {
    return "TBD";
  }

  return names.join(" / ");
}

export default async function MyMatchesPage() {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/my-matches");
  }

  if (!currentUser.linkedPlayerId) {
    return (
      <section className="admin-page login-page-shell">
        <div className="login-page-card">
          <div className="login-page-copy">
            <p className="login-page-kicker">My Matches</p>
            <h1 className="login-page-title">No player profile linked</h1>
            <p className="login-page-subtitle">
              Your account is not linked to a player profile yet. Contact an administrator to complete account setup.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        {
          homeEntry: {
            members: {
              some: {
                playerId: currentUser.linkedPlayerId,
              },
            },
          },
        },
        {
          awayEntry: {
            members: {
              some: {
                playerId: currentUser.linkedPlayerId,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      matchDate: true,
      matchTime: true,
      matchStatus: true,
      homeScore: true,
      awayScore: true,
      tournament: {
        select: {
          tournamentName: true,
        },
      },
      stageRound: {
        select: {
          roundName: true,
        },
      },
      homeEntry: {
        select: {
          id: true,
          members: {
            select: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
      awayEntry: {
        select: {
          id: true,
          members: {
            select: {
              player: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
    orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
  });

  const matchIds = matches.map((match) => match.id);
  const playerEntryIds = matches.flatMap((match) => {
    const entryIds: string[] = [];

    if (match.homeEntry.members.some((member) => member.player.id === currentUser.linkedPlayerId)) {
      entryIds.push(match.homeEntry.id);
    }

    if (match.awayEntry.members.some((member) => member.player.id === currentUser.linkedPlayerId)) {
      entryIds.push(match.awayEntry.id);
    }

    return entryIds;
  });
  const pendingSubmissionsByMatchId = await getPendingMatchResultSubmissionsForMatches(matchIds, playerEntryIds);

  const linkedPlayer = await prisma.player.findUnique({
    where: {
      id: currentUser.linkedPlayerId,
    },
    select: {
      firstName: true,
      lastName: true,
      photoUrl: true,
    },
  });

  const playerName = linkedPlayer
    ? `${linkedPlayer.firstName} ${linkedPlayer.lastName}`.trim()
    : currentUser.displayName ?? currentUser.username ?? "Matches";

  return (
    <section className="admin-page login-page-shell player-dashboard-page player-profile-page">
      <div className="login-page-card player-portal-shell player-dashboard-card">
        <PlayerPortalHeader
          kicker="My Matches"
          title="Your fixtures and results"
          subtitle="Track upcoming fixtures and completed match results assigned to your player profile."
          avatarLabel={playerName}
          avatarUrl={linkedPlayer?.photoUrl}
        />

        <div className="player-portal-content player-portal-content-wide">
          {matches.length === 0 ? (
            <p className="login-form-status login-form-status-info">
              No matches found yet for your player profile.
            </p>
          ) : (
            <div className="my-matches-list">
              {matches.map((match) => (
                <article key={match.id} className="my-match-card">
                  {(() => {
                    const scheduledAt = parseStoredMatchDateTime(match.matchDate, match.matchTime)?.toISOString() ?? null;
                    const currentEntryId = match.homeEntry.members.some(
                      (member) => member.player.id === currentUser.linkedPlayerId
                    )
                      ? match.homeEntry.id
                      : match.awayEntry.id;
                    const pendingSubmission = pendingSubmissionsByMatchId.get(match.id);
                    const pendingMode = pendingSubmission
                      ? pendingSubmission.targetEntryId === currentEntryId
                        ? "awaitingYourReview"
                        : pendingSubmission.submittedByEntryId === currentEntryId
                          ? "submittedByYou"
                          : "none"
                      : "none";
                    const pendingLabel = pendingMode === "awaitingYourReview"
                      ? "Opponent submitted a result awaiting your approval"
                      : pendingMode === "submittedByYou"
                        ? "Result submitted and waiting for opponent approval"
                        : null;

                    return (
                      <>
                  <p className="my-match-meta">
                    <strong>{match.tournament.tournamentName}</strong>
                    <span>{match.stageRound.roundName}</span>
                  </p>
                  <p className="my-match-meta">
                    <span>
                      <LocalTimeText
                        value={scheduledAt}
                        fallback="TBC"
                        options={{ weekday: "short", year: "numeric", month: "short", day: "numeric" }}
                      />
                    </span>
                    <span>
                      <LocalTimeText
                        value={scheduledAt}
                        fallback="TBA"
                        options={{ hour: "numeric", minute: "2-digit" }}
                      />
                    </span>
                    <span>{match.matchStatus.replaceAll("_", " ")}</span>
                  </p>
                  <p className="my-match-teams">
                    {formatEntryName(match.homeEntry.members)}
                    <span className="my-match-score">
                      {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                    </span>
                    {formatEntryName(match.awayEntry.members)}
                  </p>
                  {pendingLabel ? <p className="my-match-pending-note">{pendingLabel}</p> : null}
                  <div className="my-match-links-row">
                    <Link href={`/matches/${match.id}`} className="login-form-link">
                      View public match hub
                    </Link>
                    <MyMatchActions
                      matchId={match.id}
                      editHref={`/my-matches/${match.id}/edit`}
                      mode={pendingMode}
                    />
                  </div>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
