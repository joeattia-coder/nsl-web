import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../../../../TournamentSubnav";
import StageRoundForm from "../StageRoundForm";

export default async function NewStageRoundPage({
  params,
}: {
  params: Promise<{ id: string; stageId: string }>;
}) {
  const { id: tournamentId, stageId } = await params;

  const stage = await prisma.tournamentStage.findUnique({
    where: { id: stageId },
    include: {
      tournament: {
        select: {
          id: true,
          tournamentName: true,
          snookerFormat: true,
        },
      },
      rounds: {
        orderBy: { sequence: "desc" },
        take: 1,
        select: {
          sequence: true,
        },
      },
    },
  });

  if (!stage || stage.tournamentId !== tournamentId) {
    notFound();
  }

  const nextSequence = (stage.rounds[0]?.sequence ?? 0) + 1;

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{stage.tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">{stage.stageName} stage rounds.</p>
      </div>

      <TournamentSubnav tournamentId={stage.tournament.id} active="rounds" />

      <StageRoundForm
        mode="create"
        tournamentId={stage.tournament.id}
        stageId={stage.id}
        stageName={stage.stageName}
        initialData={{
          roundName: "",
          roundType: stage.stageType,
          sequence: nextSequence,
          matchesPerPairing: 1,
          bestOfFrames: 5,
          snookerFormat: (stage.tournament.snookerFormat ?? "REDS_15") as
            | "REDS_6"
            | "REDS_10"
            | "REDS_15",
          groupCount: stage.stageType === "GROUP" ? 1 : null,
          playersPerGroup: stage.stageType === "GROUP" ? 1 : null,
          advancePerGroup: null,
        }}
      />
    </section>
  );
}