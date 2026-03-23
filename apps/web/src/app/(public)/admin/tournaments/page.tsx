import { prisma } from "@/lib/prisma";
import {
  buildSeasonAdminPermissionScopes,
  buildTournamentAdminPermissionScopes,
  hasAdminPermission,
  hasScopedAdminPermission,
  requireAnyScopedAdminPermission,
} from "@/lib/admin-auth";
import TournamentsTable from "./tournaments-table";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const currentUser = await requireAnyScopedAdminPermission("tournaments.view");
  const seasons = await prisma.season.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      seasonName: true,
      startDate: true,
      endDate: true,
      leagueId: true,
    },
  });

  const tournaments = await prisma.tournament.findMany({
    include: {
      season: {
        select: {
          id: true,
          seasonName: true,
          leagueId: true,
        },
      },
      venue: true,
      _count: {
        select: {
          entries: true,
          matches: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const formattedTournaments = tournaments.map((tournament) => ({
    id: tournament.id,
    seasonId: tournament.seasonId,
    leagueId: tournament.season.leagueId ?? "",
    tournamentName: tournament.tournamentName,
    seasonName: tournament.season.seasonName,
    venueName: tournament.venue?.venueName ?? "",
    participantType: tournament.participantType,
    status: tournament.status,
    isPublished: tournament.isPublished,
    registrationDeadline: tournament.registrationDeadline
      ? tournament.registrationDeadline.toISOString()
      : "",
    startDate: tournament.startDate ? tournament.startDate.toISOString() : "",
    endDate: tournament.endDate ? tournament.endDate.toISOString() : "",
    entriesCount: tournament._count.entries,
    matchesCount: tournament._count.matches,
    canEdit: hasScopedAdminPermission(
      currentUser,
      "tournaments.edit",
      buildTournamentAdminPermissionScopes(
        tournament.id,
        tournament.seasonId,
        tournament.season.leagueId
      )
    ),
    canDelete: hasScopedAdminPermission(
      currentUser,
      "tournaments.delete",
      buildTournamentAdminPermissionScopes(
        tournament.id,
        tournament.seasonId,
        tournament.season.leagueId
      )
    ),
  }));

  const visibleTournaments = formattedTournaments.filter((tournament) =>
    hasScopedAdminPermission(
      currentUser,
      "tournaments.view",
      buildTournamentAdminPermissionScopes(
        tournament.id,
        tournament.seasonId,
        tournament.leagueId || null
      )
    )
  );

  const formattedSeasons = seasons.map((season) => ({
    id: season.id,
    seasonName: season.seasonName,
    startDate: season.startDate ? season.startDate.toISOString() : "",
    endDate: season.endDate ? season.endDate.toISOString() : "",
    leagueId: season.leagueId,
  })).filter((season) =>
    visibleTournaments.some((tournament) => tournament.seasonId === season.id) ||
    hasScopedAdminPermission(
      currentUser,
      "tournaments.create",
      buildSeasonAdminPermissionScopes(season.id, season.leagueId)
    )
  );

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Tournaments</h1>
        <p className="admin-page-subtitle">
          Create and manage tournaments across all seasons.
        </p>
      </div>

      <TournamentsTable
        tournaments={visibleTournaments}
        seasons={formattedSeasons}
        canCreate={hasAdminPermission(currentUser, "tournaments.create") || formattedSeasons.some((season) => hasScopedAdminPermission(currentUser, "tournaments.create", buildSeasonAdminPermissionScopes(season.id, season.leagueId)))}
      />
    </section>
  );
}