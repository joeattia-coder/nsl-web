import { prisma } from "@/lib/prisma";
import TournamentsTable from "./tournaments-table";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });

  const tournaments = await prisma.tournament.findMany({
    include: {
      season: true,
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
  }));

  const formattedSeasons = seasons.map((season) => ({
    id: season.id,
    seasonName: season.seasonName,
    startDate: season.startDate ? season.startDate.toISOString() : "",
    endDate: season.endDate ? season.endDate.toISOString() : "",
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Tournaments</h1>
        <p className="admin-page-subtitle">
          Create and manage tournaments across all seasons.
        </p>
      </div>

      <TournamentsTable
        tournaments={formattedTournaments}
        seasons={formattedSeasons}
      />
    </section>
  );
}