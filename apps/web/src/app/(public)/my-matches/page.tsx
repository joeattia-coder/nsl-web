import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function formatMatchDate(date: Date | null) {
  if (!date) {
    return "TBC";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
          members: {
            select: {
              player: {
                select: {
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
          members: {
            select: {
              player: {
                select: {
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

  return (
    <section className="admin-page login-page-shell">
      <div className="login-page-card my-matches-shell">
        <div className="login-page-copy">
          <p className="login-page-kicker">My Matches</p>
          <h1 className="login-page-title">Your fixtures and results</h1>
          <p className="login-page-subtitle">
            Matches assigned to your player profile across all tournaments.
          </p>
        </div>

        {matches.length === 0 ? (
          <p className="login-form-status login-form-status-info">
            No matches found yet for your player profile.
          </p>
        ) : (
          <div className="my-matches-list">
            {matches.map((match) => (
              <article key={match.id} className="my-match-card">
                <p className="my-match-meta">
                  <strong>{match.tournament.tournamentName}</strong>
                  <span>{match.stageRound.roundName}</span>
                </p>
                <p className="my-match-meta">
                  <span>{formatMatchDate(match.matchDate)}</span>
                  <span>{match.matchTime || "TBA"}</span>
                  <span>{match.matchStatus.replaceAll("_", " ")}</span>
                </p>
                <p className="my-match-teams">
                  {formatEntryName(match.homeEntry.members)}
                  <span className="my-match-score">
                    {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
                  </span>
                  {formatEntryName(match.awayEntry.members)}
                </p>
                <Link href="/matches" className="login-form-link">
                  View public match hub
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
