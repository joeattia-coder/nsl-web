import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentStageForm from "../../TournamentStageForm";
import TournamentSubnav from "../../../TournamentSubnav";

type PageProps = {
  params: Promise<{ id: string; stageId: string }>;
};

export default async function EditTournamentStagePage({ params }: PageProps) {
  const { id: tournamentId, stageId } = await params;

  const stage = await prisma.tournamentStage.findUnique({
    where: { id: stageId },
    include: {
      tournament: {
        select: {
          id: true,
          tournamentName: true,
        },
      },
    },
  });

  if (!stage || stage.tournamentId !== tournamentId) {
    notFound();
  }

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{stage.tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          Manage tournament details and structure.
        </p>
      </div>

      <TournamentSubnav tournamentId={stage.tournament.id} active="stages" />

      <TournamentStageForm
        mode="edit"
        tournamentId={stage.tournament.id}
        tournamentName={stage.tournament.tournamentName}
        stageId={stage.id}
        initialData={{
          stageName: stage.stageName,
          stageType: stage.stageType,
          sequence: stage.sequence,
        }}
      />
    </section>
  );
}