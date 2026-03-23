import { notFound } from "next/navigation";
import {
  buildSeasonAdminPermissionScopes,
  getTournamentAdminPermissionScopes,
  hasScopedAdminPermission,
  requireScopedAdminPermission,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import TournamentForm from "../../TournamentForm";
import TournamentSubnav from "../TournamentSubnav";

function toDateTimeLocal(date: Date | null) {
  if (!date) return "";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const hours = `${d.getHours()}`.padStart(2, "0");
  const minutes = `${d.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTournamentPage({ params }: PageProps) {
  const { id } = await params;
  const permissionScopes = await getTournamentAdminPermissionScopes(id);

  if (!permissionScopes) {
    notFound();
  }

  const currentUser = await requireScopedAdminPermission("tournaments.edit", permissionScopes);

  const [tournament, seasons, venues] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
    }),
    prisma.season.findMany({
      orderBy: [{ startDate: "desc" }, { seasonName: "asc" }],
      select: {
        id: true,
        seasonName: true,
        leagueId: true,
      },
    }),
    prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { venueName: "asc" },
      select: {
        id: true,
        venueName: true,
      },
    }),
  ]);

  if (!tournament) {
    notFound();
  }

  const visibleSeasons = seasons.filter(
    (season) =>
      season.id === tournament.seasonId ||
      hasScopedAdminPermission(
        currentUser,
        "tournaments.create",
        buildSeasonAdminPermissionScopes(season.id, season.leagueId)
      )
  );

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          Manage tournament details and structure.
        </p>
      </div>

      <TournamentSubnav tournamentId={tournament.id} active="details" />

      <TournamentForm
        mode="edit"
        seasons={visibleSeasons}
        venues={venues}
        initialData={{
          id: tournament.id,
          seasonId: tournament.seasonId,
          venueId: tournament.venueId ?? "",
          tournamentName: tournament.tournamentName,
          participantType: tournament.participantType,
          registrationDeadline: toDateTimeLocal(
            tournament.registrationDeadline
          ),
          startDate: toDateTimeLocal(tournament.startDate),
          endDate: toDateTimeLocal(tournament.endDate),
          status: tournament.status,
          isPublished: tournament.isPublished,
          description: tournament.description ?? "",
          snookerFormat: (tournament.snookerFormat as "REDS_6" | "REDS_10" | "REDS_15" | null) ?? null,
        }}
      />
    </section>
  );
}