import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../../../TournamentSubnav";
import StageRoundsTable from "./rounds-table";

export const dynamic = "force-dynamic";

export default async function StageRoundsPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>;
}) {
  const { id: tournamentId, stageId } = await params;

  const [stage, rounds] = await Promise.all([
    prisma.tournamentStage.findUnique({
      where: { id: stageId },
      include: {
        tournament: {
          select: {
            id: true,
            tournamentName: true,
          },
        },
      },
    }),
    prisma.stageRound.findMany({
      where: { tournamentStageId: stageId },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: {
            groups: true,
            matches: true,
          },
        },
      },
    }),
  ]);

  if (!stage || stage.tournamentId !== tournamentId) {
    notFound();
  }

  const formattedRounds = rounds.map((round) => ({
    id: round.id,
    roundName: round.roundName,
    roundType: round.roundType,
    sequence: round.sequence,
    matchesPerPairing: round.matchesPerPairing,
    groupsCount: round._count.groups,
    matchesCount: round._count.matches,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{stage.tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          {stage.stageName} stage structure and rounds.
        </p>
      </div>

      <TournamentSubnav tournamentId={stage.tournament.id} active="rounds" />

      <StageRoundsTable
        tournamentId={stage.tournament.id}
        tournamentName={stage.tournament.tournamentName}
        stageId={stage.id}
        stageName={stage.stageName}
        rounds={formattedRounds}
      />
    </section>
  );
}