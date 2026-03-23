import { prisma } from "@/lib/prisma";
import {
  buildSeasonAdminPermissionScopes,
  hasScopedAdminPermission,
  requireAnyScopedAdminPermission,
} from "@/lib/admin-auth";
import TournamentForm from "../TournamentForm";

export default async function NewTournamentPage() {
  const currentUser = await requireAnyScopedAdminPermission("tournaments.create");
  const [seasons, venues] = await Promise.all([
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

  const visibleSeasons = seasons.filter((season) =>
    hasScopedAdminPermission(
      currentUser,
      "tournaments.create",
      buildSeasonAdminPermissionScopes(season.id, season.leagueId)
    )
  );

  return <TournamentForm mode="create" seasons={visibleSeasons} venues={venues} />;
}