import { prisma } from "@/lib/prisma";
import MatchesTable, { type MatchRow } from "./MatchesTable";

export const dynamic = "force-dynamic";

function formatEntryName(entry: {
  entryName: string | null;
  members: Array<{
    player: { firstName: string; middleInitial: string | null; lastName: string };
  }>;
}) {
  if (entry.entryName?.trim()) return entry.entryName.trim();
  const names = entry.members.map(({ player }) =>
    [player.firstName, player.middleInitial, player.lastName]
      .filter(Boolean)
      .join(" ")
  );
  return names.join(" / ") || "Unnamed Entry";
}

export default async function AdminMatchesPage() {
  const now = new Date();

  const [leagues, matches] = await Promise.all([
    prisma.league.findMany({
      orderBy: { leagueName: "asc" },
      select: { id: true, leagueName: true },
    }),
    prisma.match.findMany({
      orderBy: [{ matchDate: "asc" }, { createdAt: "asc" }],
      include: {
        tournament: {
          select: {
            id: true,
            tournamentName: true,
            season: {
              select: {
                leagueId: true,
                League: { select: { id: true, leagueName: true } },
              },
            },
          },
        },
        venue: { select: { id: true, venueName: true } },
        homeEntry: {
          include: {
            members: {
              include: {
                player: {
                  select: { firstName: true, middleInitial: true, lastName: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        awayEntry: {
          include: {
            members: {
              include: {
                player: {
                  select: { firstName: true, middleInitial: true, lastName: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    }),
  ]);

  // Determine default league: find leagues whose season spans today
  const activeSeasonsToday = await prisma.season.findMany({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
      leagueId: { not: null },
    },
    select: { leagueId: true },
  });

  const activeLeagueIds = [...new Set(
    activeSeasonsToday.map((s) => s.leagueId).filter(Boolean) as string[]
  )];

  // Default to that league only if exactly one, otherwise all
  const defaultLeagueId = activeLeagueIds.length === 1 ? activeLeagueIds[0] : null;

  // Build unique tournaments for the filter dropdown
  const tournamentMap = new Map<string, { id: string; tournamentName: string; leagueId: string }>();
  for (const match of matches) {
    const t = match.tournament;
    if (!tournamentMap.has(t.id)) {
      tournamentMap.set(t.id, {
        id: t.id,
        tournamentName: t.tournamentName,
        leagueId: t.season.leagueId ?? "",
      });
    }
  }
  const tournaments = Array.from(tournamentMap.values()).sort((a, b) =>
    a.tournamentName.localeCompare(b.tournamentName)
  );

  const formattedMatches: MatchRow[] = matches.map((match) => ({
    id: match.id,
    tournamentId: match.tournamentId,
    leagueId: match.tournament.season.leagueId ?? "",
    leagueName: match.tournament.season.League?.leagueName ?? "",
    tournamentId2: match.tournamentId,
    tournamentName: match.tournament.tournamentName,
    homeName: formatEntryName(match.homeEntry),
    awayName: formatEntryName(match.awayEntry),
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    venueName: match.venue?.venueName ?? "",
    matchDate: match.matchDate ? match.matchDate.toISOString() : "",
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Matches</h1>
        <p className="admin-page-subtitle">
          View and manage all matches across leagues and tournaments.
        </p>
      </div>

      <MatchesTable
        matches={formattedMatches}
        leagues={leagues}
        tournaments={tournaments}
        defaultLeagueId={defaultLeagueId}
      />
    </section>
  );
}