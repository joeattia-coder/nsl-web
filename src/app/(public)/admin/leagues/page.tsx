import { prisma } from "@/lib/prisma";
import LeaguesTable from "./leagues-table";

export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage() {
  const leagues = await prisma.league.findMany({
    orderBy: [{ leagueName: "asc" }],
    select: {
      id: true,
      leagueName: true,
      description: true,
      isActive: true,
      logoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const leaguesWithUsage = await Promise.all(
    leagues.map(async (league) => {
      const [seasonCount, tournamentCount, stageCount, roundCount, groupCount, matchCount] =
        await Promise.all([
          prisma.season.count({ where: { leagueId: league.id } }),
          prisma.tournament.count({ where: { season: { leagueId: league.id } } }),
          prisma.tournamentStage.count({
            where: { tournament: { season: { leagueId: league.id } } },
          }),
          prisma.stageRound.count({
            where: {
              tournamentStage: { tournament: { season: { leagueId: league.id } } },
            },
          }),
          prisma.tournamentGroup.count({
            where: {
              stageRound: {
                tournamentStage: { tournament: { season: { leagueId: league.id } } },
              },
            },
          }),
          prisma.match.count({
            where: { tournament: { season: { leagueId: league.id } } },
          }),
        ]);

      const dependencyParts = [
        seasonCount ? `${seasonCount} season${seasonCount === 1 ? "" : "s"}` : null,
        tournamentCount
          ? `${tournamentCount} tournament${tournamentCount === 1 ? "" : "s"}`
          : null,
        stageCount ? `${stageCount} stage${stageCount === 1 ? "" : "s"}` : null,
        roundCount ? `${roundCount} round${roundCount === 1 ? "" : "s"}` : null,
        groupCount ? `${groupCount} group${groupCount === 1 ? "" : "s"}` : null,
        matchCount ? `${matchCount} match${matchCount === 1 ? "" : "es"}` : null,
      ].filter(Boolean) as string[];

      return {
        ...league,
        canDelete: dependencyParts.length === 0,
        dependencySummary: dependencyParts.join(", "),
      };
    })
  );

  return (
    <section className="admin-page">
      <div className="admin-leagues-header">
        <h1 className="admin-page-title">Leagues</h1>
        <p className="admin-page-subtitle">
          Manage leagues, descriptions, and status.
        </p>
      </div>
      <LeaguesTable leagues={leaguesWithUsage.map(l => ({
        id: l.id,
        leagueName: l.leagueName,
        description: l.description ?? "",
        isActive: l.isActive,
        logoUrl: l.logoUrl ?? "",
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        canDelete: l.canDelete,
        dependencySummary: l.dependencySummary,
      }))} />
    </section>
  );
}
