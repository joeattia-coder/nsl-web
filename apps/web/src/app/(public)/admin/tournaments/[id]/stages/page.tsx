import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentStagesTable from "./stages-table";
import TournamentSubnav from "../TournamentSubnav";

export const dynamic = "force-dynamic";

export default async function TournamentStagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = await params;

  const [tournament, stages] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        tournamentName: true,
      },
    }),
    prisma.tournamentStage.findMany({
      where: { tournamentId },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: {
            rounds: true,
            matches: true,
          },
        },
      },
    }),
  ]);

  if (!tournament) {
    notFound();
  }

  const formattedStages = stages.map((stage) => ({
    id: stage.id,
    stageName: stage.stageName,
    stageType: stage.stageType,
    sequence: stage.sequence,
    roundsCount: stage._count.rounds,
    matchesCount: stage._count.matches,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          Manage tournament details and structure.
        </p>
      </div>

      <TournamentSubnav tournamentId={tournament.id} active="stages" />

      <TournamentStagesTable
        tournamentId={tournament.id}
        tournamentName={tournament.tournamentName}
        stages={formattedStages}
      />
    </section>
  );
}