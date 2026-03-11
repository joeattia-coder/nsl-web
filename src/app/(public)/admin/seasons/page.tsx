import { prisma } from "@/lib/prisma";
import SeasonsTable from "./SeasonsTable";

export const dynamic = "force-dynamic";

export default async function AdminSeasonsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: [{ seasonName: "asc" }],
    select: {
      id: true,
      seasonName: true,
      startDate: true,
      endDate: true,
      isActive: true,
    },
  });

  const formattedSeasons = seasons.map((season) => ({
    id: season.id,
    seasonName: season.seasonName,
    startDate: season.startDate ? season.startDate.toISOString() : "",
    endDate: season.endDate ? season.endDate.toISOString() : "",
    isActive: season.isActive,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Seasons</h1>
        <p className="admin-page-subtitle">
          Manage league seasons and organize tournaments by season.
        </p>
      </div>

      <SeasonsTable seasons={formattedSeasons} />
    </section>
  );
}