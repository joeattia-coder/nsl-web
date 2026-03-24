import { redirect } from "next/navigation";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import PlayerPortalHeader from "../PlayerPortalHeader";
import MyTournamentsClient from "./MyTournamentsClient";

function sortTournamentRows(
  left: {
    status: string;
    startDate: string | null;
    tournamentName: string;
  },
  right: {
    status: string;
    startDate: string | null;
    tournamentName: string;
  }
) {
  const activeWeight = (status: string) => {
    if (status === "IN_PROGRESS") return 0;
    if (status === "REGISTRATION_OPEN") return 1;
    if (status === "REGISTRATION_CLOSED") return 2;
    if (status === "COMPLETED") return 3;
    if (status === "CANCELLED") return 4;
    return 5;
  };

  const statusDifference = activeWeight(left.status) - activeWeight(right.status);

  if (statusDifference !== 0) {
    return statusDifference;
  }

  const leftDate = left.startDate ? new Date(left.startDate).getTime() : Number.MAX_SAFE_INTEGER;
  const rightDate = right.startDate ? new Date(right.startDate).getTime() : Number.MAX_SAFE_INTEGER;

  if (leftDate !== rightDate) {
    return leftDate - rightDate;
  }

  return left.tournamentName.localeCompare(right.tournamentName);
}

export default async function MyTournamentsPage() {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/my-tournaments");
  }

  if (!currentUser.linkedPlayerId) {
    return (
      <section className="admin-page login-page-shell player-dashboard-page player-profile-page">
        <div className="login-page-card">
          <div className="login-page-copy">
            <p className="login-page-kicker">My Tournaments</p>
            <h1 className="login-page-title">No player profile linked</h1>
            <p className="login-page-subtitle">
              Your account is not linked to a player profile yet. Contact an administrator to complete account setup.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const memberships = await prisma.tournamentEntryMember.findMany({
    where: {
      playerId: currentUser.linkedPlayerId,
    },
    select: {
      tournamentEntry: {
        select: {
          tournament: {
            select: {
              id: true,
              tournamentName: true,
              status: true,
              startDate: true,
              endDate: true,
              registrationDeadline: true,
              season: {
                select: {
                  seasonName: true,
                },
              },
              venue: {
                select: {
                  venueName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const tournaments = Array.from(
    new Map(
      memberships.map((membership) => {
        const tournament = membership.tournamentEntry.tournament;

        return [
          tournament.id,
          {
            id: tournament.id,
            tournamentName: tournament.tournamentName,
            status: tournament.status,
            seasonName: tournament.season.seasonName,
            venueName: tournament.venue?.venueName ?? null,
            startDate: tournament.startDate ? tournament.startDate.toISOString() : null,
            endDate: tournament.endDate ? tournament.endDate.toISOString() : null,
            registrationDeadline: tournament.registrationDeadline
              ? tournament.registrationDeadline.toISOString()
              : null,
          },
        ];
      })
    ).values()
  ).sort(sortTournamentRows);

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
    : currentUser.displayName ?? currentUser.username ?? currentUser.email ?? "Tournaments";

  return (
    <section className="admin-page login-page-shell player-dashboard-page player-profile-page">
      <div className="login-page-card player-portal-shell player-dashboard-card">
        <PlayerPortalHeader
          kicker="My Tournaments"
          title="Your tournament registrations"
          subtitle="Review every tournament you are registered in and switch the standings view to one selected tournament at a time."
          avatarLabel={playerName}
          avatarUrl={linkedPlayer?.photoUrl}
        />

        <div className="player-portal-content player-portal-content-wide">
          <MyTournamentsClient tournaments={tournaments} />
        </div>
      </div>
    </section>
  );
}