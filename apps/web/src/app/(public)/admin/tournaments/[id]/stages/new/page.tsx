import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentStageForm from "../TournamentStageForm";

export default async function NewTournamentStagePage({
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
      stages: {
        orderBy: { sequence: "desc" },
        take: 1,
        select: {
          sequence: true,
        },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const nextSequence = (tournament.stages[0]?.sequence ?? 0) + 1;

  return (
    <TournamentStageForm
      mode="create"
      tournamentId={tournament.id}
      tournamentName={tournament.tournamentName}
      initialData={{
        stageName: "",
        stageType: "GROUP",
        sequence: nextSequence,
      }}
    />
  );
}