import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../../../../../TournamentSubnav";
import StageSubnav from "../../../StageSubnav";
import RoundSubnav from "../../RoundSubnav";
import GroupsTable from "./groups-table";

export const dynamic = "force-dynamic";

export default async function RoundGroupsPage({
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
            },
          },
        },
      },
      groups: {
        orderBy: {
          sequence: "asc",
        },
        include: {
          participants: true,
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

  const groups = round.groups.map((group) => ({
    id: group.id,
    groupName: group.groupName,
    sequence: group.sequence,
    assignedCount: group.participants.length,
    capacity: round.playersPerGroup ?? 0,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">
          {round.tournamentStage.tournament.tournamentName}
        </h1>
        <p className="admin-page-subtitle">
          {round.roundName} group assignments.
        </p>
      </div>

      <TournamentSubnav
        tournamentId={round.tournamentStage.tournament.id}
        active="stages"
      />
      <StageSubnav
        tournamentId={round.tournamentStage.tournament.id}
        stageId={round.tournamentStage.id}
        active="rounds"
      />
      <RoundSubnav
        tournamentId={round.tournamentStage.tournament.id}
        stageId={round.tournamentStage.id}
        roundId={round.id}
        active="groups"
      />

      <GroupsTable
        tournamentId={round.tournamentStage.tournament.id}
        stageId={round.tournamentStage.id}
        roundId={round.id}
        roundName={round.roundName}
        groups={groups}
      />
    </section>
  );
}