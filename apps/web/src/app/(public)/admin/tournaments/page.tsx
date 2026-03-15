import { prisma } from "@/lib/prisma";
import TournamentsTable from "./tournaments-table";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      season: true,
      venue: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const formattedTournaments = tournaments.map((tournament) => ({
    id: tournament.id,
    tournamentName: tournament.tournamentName,
    seasonName: tournament.season.seasonName,
    venueName: tournament.venue?.venueName ?? "",
    participantType: tournament.participantType,
    status: tournament.status,
    isPublished: tournament.isPublished,
    startDate: tournament.startDate ? tournament.startDate.toISOString() : "",
    endDate: tournament.endDate ? tournament.endDate.toISOString() : "",
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Tournaments</h1>
        <p className="admin-page-subtitle">
          Create and manage tournaments across all seasons.
        </p>
      </div>

      <TournamentsTable tournaments={formattedTournaments} />
    </section>
  );
}