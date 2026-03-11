import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../TournamentSubnav";
import TournamentMatchesTable from "./TournamentMatchesTable";

function formatParticipantTypeLabel(entry: {
  entryName: string | null;
  members: Array<{
    player: {
      firstName: string;
      middleInitial: string | null;
      lastName: string;
    };
  }>;
}) {
  if (entry.entryName?.trim()) {
    return entry.entryName.trim();
  }

  const names = entry.members.map(({ player }) =>
    [player.firstName, player.middleInitial, player.lastName]
      .filter(Boolean)
      .join(" ")
  );

  return names.join(" / ") || "Unnamed Entry";
}

function formatStageType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const dynamic = "force-dynamic";

export default async function TournamentMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      tournamentName: true,
      matches: {
        orderBy: [
          { matchDate: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          tournamentStage: {
            select: {
              id: true,
              stageName: true,
              stageType: true,
            },
          },
          stageRound: {
            select: {
              id: true,
              roundName: true,
              roundType: true,
            },
          },
          tournamentGroup: {
            select: {
              id: true,
              groupName: true,
            },
          },
          venue: {
            select: {
              id: true,
              venueName: true,
            },
          },
          homeEntry: {
            include: {
              members: {
                include: {
                  player: {
                    select: {
                      firstName: true,
                      middleInitial: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          awayEntry: {
            include: {
              members: {
                include: {
                  player: {
                    select: {
                      firstName: true,
                      middleInitial: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          winnerEntry: {
            include: {
              members: {
                include: {
                  player: {
                    select: {
                      firstName: true,
                      middleInitial: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const matches = tournament.matches.map((match) => ({
    id: match.id,
    stageName: match.tournamentStage.stageName,
    stageType: formatStageType(match.tournamentStage.stageType),
    roundName: match.stageRound.roundName,
    roundType: formatStageType(match.stageRound.roundType),
    groupName: match.tournamentGroup?.groupName ?? "",
    homeName: formatParticipantTypeLabel(match.homeEntry),
    awayName: formatParticipantTypeLabel(match.awayEntry),
    winnerName: match.winnerEntry ? formatParticipantTypeLabel(match.winnerEntry) : "",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    matchDate: match.matchDate ? match.matchDate.toISOString() : "",
    matchTime: match.matchTime ?? "",
    matchStatus: match.matchStatus,
    scheduleStatus: match.scheduleStatus,
    venueName: match.venue?.venueName ?? "",
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          View generated matches across group and knockout stages.
        </p>
      </div>

      <TournamentSubnav tournamentId={tournament.id} active="matches" />

      <TournamentMatchesTable
        tournamentId={tournament.id}
        matches={matches}
      />
    </section>
  );
}