import Link from "next/link";
import { redirect } from "next/navigation";
import LocalTimeText from "@/components/LocalTimeText";
import { getFlagCdnUrl } from "@/lib/country";
import { getPendingMatchResultSubmissionsForMatches } from "@/lib/match-result-submission-store";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseStoredMatchDateTime } from "@/lib/timezone";
import MyMatchActions from "./MyMatchActions";
import PlayerPortalHeader from "../PlayerPortalHeader";
import PlayerPortalPortrait from "../PlayerPortalPortrait";

type MatchEntryMember = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    country: string | null;
  };
};

function formatEntryName(members: MatchEntryMember[]) {
  const names = members.map((member) => `${member.player.firstName} ${member.player.lastName}`.trim());

  if (names.length === 0) {
    return "TBD";
  }

  return names.join(" / ");
}

function getEntryPhotoUrl(members: MatchEntryMember[]) {
  return members.map((member) => member.player.photoUrl?.trim() ?? "").find(Boolean) || null;
}

function getEntryCountry(members: MatchEntryMember[]) {
  return members.map((member) => member.player.country?.trim() ?? "").find(Boolean) || null;
}

function formatMatchStatus(matchStatus: string) {
  return matchStatus
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
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
                  photoUrl: true,
                  country: true,
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
                  photoUrl: true,
                  country: true,
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
                    const homeName = formatEntryName(match.homeEntry.members);
                    const awayName = formatEntryName(match.awayEntry.members);
                    const homePhotoUrl = getEntryPhotoUrl(match.homeEntry.members);
                    const awayPhotoUrl = getEntryPhotoUrl(match.awayEntry.members);
                    const homeCountry = getEntryCountry(match.homeEntry.members);
                    const awayCountry = getEntryCountry(match.awayEntry.members);
                    const homeFlagUrl = getFlagCdnUrl(homeCountry, "w40");
                    const awayFlagUrl = getFlagCdnUrl(awayCountry, "w40");

                    return (
                      <>
                  <div className="my-match-header">
                    <div className="my-match-header-main">
                      <strong>{match.tournament.tournamentName}</strong>
                      <span>{match.stageRound.roundName}</span>
                    </div>
                    <div className="my-match-header-side">
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
                      <span className="my-match-status-chip">{formatMatchStatus(match.matchStatus)}</span>
                    </div>
                  </div>
                  <div className="my-match-teams">
                    <div className="my-match-player my-match-player-left">
                      <PlayerPortalPortrait
                        photoUrl={homePhotoUrl}
                        alt={homeName}
                        className="my-match-player-photo"
                      />
                      <div className="my-match-player-name-row my-match-player-name-row-left">
                        <span className="my-match-player-name">{homeName}</span>
                        {homeFlagUrl ? (
                          <img
                            src={homeFlagUrl}
                            alt={homeCountry ? `${homeCountry} flag` : ""}
                            className="my-match-player-flag"
                          />
                        ) : null}
                      </div>
                    </div>
                    <span className="my-match-score">
                      {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                    </span>
                    <div className="my-match-player my-match-player-right">
                      <PlayerPortalPortrait
                        photoUrl={awayPhotoUrl}
                        alt={awayName}
                        className="my-match-player-photo"
                      />
                      <div className="my-match-player-name-row my-match-player-name-row-right">
                        {awayFlagUrl ? (
                          <img
                            src={awayFlagUrl}
                            alt={awayCountry ? `${awayCountry} flag` : ""}
                            className="my-match-player-flag"
                          />
                        ) : null}
                        <span className="my-match-player-name">{awayName}</span>
                      </div>
                    </div>
                  </div>
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
