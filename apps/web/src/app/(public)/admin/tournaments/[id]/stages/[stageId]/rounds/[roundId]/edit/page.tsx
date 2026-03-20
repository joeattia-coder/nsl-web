import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../../../../../TournamentSubnav";
import StageRoundForm from "../../StageRoundForm";

export default async function EditStageRoundPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string; roundId: string }>;
}) {
  const { id: tournamentId, stageId, roundId } = await params;

  const round = await prisma.stageRound.findUnique({
    where: { id: roundId },
    include: {
      tournamentStage: {
        include: {
          tournament: {
            select: {
              id: true,
              tournamentName: true,
              snookerFormat: true,
            },
          },
        },
      },
    },
  });

  if (
    !round ||
    round.tournamentStageId !== stageId ||
    round.tournamentStage.tournamentId !== tournamentId
  ) {
    notFound();
  }

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">
          {round.tournamentStage.tournament.tournamentName}
        </h1>
        <p className="admin-page-subtitle">
          {round.tournamentStage.stageName} stage rounds.
        </p>
      </div>

      <TournamentSubnav
        tournamentId={round.tournamentStage.tournament.id}
        active="rounds"
      />


      <StageRoundForm
        mode="edit"
        tournamentId={round.tournamentStage.tournament.id}
        stageId={round.tournamentStage.id}
        stageName={round.tournamentStage.stageName}
        roundId={round.id}
        initialData={{
          roundName: round.roundName,
          roundType: round.roundType,
          sequence: round.sequence,
          matchesPerPairing: round.matchesPerPairing,
          bestOfFrames: round.bestOfFrames ?? 5,
          snookerFormat: (round.snookerFormat ?? round.tournamentStage.tournament.snookerFormat ?? "REDS_15") as
            | "REDS_6"
            | "REDS_10"
            | "REDS_15",
          groupCount: round.groupCount ?? null,
          playersPerGroup: round.playersPerGroup ?? null,
          advancePerGroup: round.advancePerGroup ?? null,
        }}
      />
    </section>
  );
}