import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../../../../../../TournamentSubnav";
import StageSubnav from "../../../../StageSubnav";
import RoundSubnav from "../../../RoundSubnav";
import ManageGroupForm from "./ManageGroupForm";

function getPlayerFullName(player: {
  firstName: string;
  middleInitial: string | null;
  lastName: string;
}) {
  return [player.firstName, player.middleInitial, player.lastName]
    .filter(Boolean)
    .join(" ");
}

function formatEntryLabel(entry: {
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

  const names = entry.members.map(({ player }) => getPlayerFullName(player));
  return names.join(" / ") || "Unnamed Entry";
}

export default async function ManageGroupPage({
  params,
}: {
  params: Promise<{
    id: string;
    stageId: string;
    roundId: string;
    groupId: string;
  }>;
}) {
  const { id: tournamentId, stageId, roundId, groupId } = await params;

  const group = await prisma.tournamentGroup.findUnique({
    where: { id: groupId },
    include: {
      stageRound: {
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
        },
      },
      participants: {
        include: {
          tournamentEntry: {
            include: {
              members: {
                include: {
                  player: {
                    select: {
                      id: true,
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
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (
    !group ||
    group.stageRoundId !== roundId ||
    group.stageRound.tournamentStageId !== stageId ||
    group.stageRound.tournamentStage.tournamentId !== tournamentId
  ) {
    notFound();
  }

  const entries = await prisma.tournamentEntry.findMany({
    where: {
      tournamentId,
    },
    include: {
      members: {
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              middleInitial: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
  });

  const assignedElsewhere = await prisma.groupParticipant.findMany({
    where: {
      tournamentGroup: {
        stageRoundId: roundId,
      },
      NOT: {
        tournamentGroupId: groupId,
      },
    },
    select: {
      tournamentEntryId: true,
    },
  });

  const assignedElsewhereIds = new Set(
    assignedElsewhere.map((item) => item.tournamentEntryId)
  );

  const entryOptions = entries.map((entry) => ({
    id: entry.id,
    label: formatEntryLabel(entry),
    disabled: assignedElsewhereIds.has(entry.id),
  }));

  const initialEntryIds = group.participants.map(
    (participant) => participant.tournamentEntryId
  );

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">
          {group.stageRound.tournamentStage.tournament.tournamentName}
        </h1>
        <p className="admin-page-subtitle">
          {group.groupName} assignments for {group.stageRound.roundName}.
        </p>
      </div>

      <TournamentSubnav
        tournamentId={group.stageRound.tournamentStage.tournament.id}
        active="rounds"
      />
      <StageSubnav
        tournamentId={group.stageRound.tournamentStage.tournament.id}
        stageId={group.stageRound.tournamentStage.id}
        active="rounds"
      />
      <RoundSubnav
        tournamentId={group.stageRound.tournamentStage.tournament.id}
        stageId={group.stageRound.tournamentStage.id}
        roundId={group.stageRound.id}
        active="groups"
      />

      <ManageGroupForm
        tournamentId={group.stageRound.tournamentStage.tournament.id}
        stageId={group.stageRound.tournamentStage.id}
        roundId={group.stageRound.id}
        groupId={group.id}
        groupName={group.groupName}
        playersPerGroup={group.stageRound.playersPerGroup ?? 0}
        entryOptions={entryOptions}
        initialEntryIds={initialEntryIds}
      />
    </section>
  );
}