import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../../../TournamentSubnav";
import MatchResultForm from "./MatchResultForm";

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

export const dynamic = "force-dynamic";

function toDateTimeLocal(date: Date | null | undefined, time?: string | null) {
  if (!date) {
    return "";
  }

  const isoDate = date.toISOString().slice(0, 10);
  const normalizedTime = time?.slice(0, 5) ?? "00:00";
  return `${isoDate}T${normalizedTime}`;
}

function toDateTimeLocalFromDate(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

function buildFrameHighBreaks(
  frameCount: number,
  frames: Array<{ frameNumber: number; homeHighBreak: number | null; awayHighBreak: number | null }>
) {
  const homeHighBreaks = Array.from({ length: frameCount }, () => "");
  const awayHighBreaks = Array.from({ length: frameCount }, () => "");

  for (const frame of frames) {
    const index = frame.frameNumber - 1;
    if (index < 0 || index >= frameCount) {
      continue;
    }

    homeHighBreaks[index] = frame.homeHighBreak === null ? "" : String(frame.homeHighBreak);
    awayHighBreaks[index] = frame.awayHighBreak === null ? "" : String(frame.awayHighBreak);
  }

  return {
    homeHighBreaks,
    awayHighBreaks,
  };
}

export default async function EditTournamentMatchPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id: tournamentId, matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: {
        select: {
          id: true,
          tournamentName: true,
        },
      },
      stageRound: {
        select: {
          bestOfFrames: true,
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
            orderBy: { createdAt: "asc" },
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
            orderBy: { createdAt: "asc" },
          },
        },
      },
      frames: {
        select: {
          frameNumber: true,
          homeHighBreak: true,
          awayHighBreak: true,
        },
        orderBy: { frameNumber: "asc" },
      },
    },
  });

  if (!match || match.tournamentId !== tournamentId) {
    notFound();
  }

  const homeLabel = formatParticipantTypeLabel(match.homeEntry);
  const awayLabel = formatParticipantTypeLabel(match.awayEntry);
  const bestOfFrames = match.bestOfFrames ?? match.stageRound.bestOfFrames ?? 5;
  const frameHighBreaks = buildFrameHighBreaks(bestOfFrames, match.frames);

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{match.tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">Enter result for {homeLabel} vs {awayLabel}.</p>
      </div>

      <TournamentSubnav tournamentId={match.tournament.id} active="matches" />

      <MatchResultForm
        tournamentId={match.tournament.id}
        matchId={match.id}
        homeEntry={{ id: match.homeEntry.id, label: homeLabel }}
        awayEntry={{ id: match.awayEntry.id, label: awayLabel }}
        initialData={{
          startDateTime: toDateTimeLocal(match.matchDate, match.matchTime),
          endDateTime: toDateTimeLocalFromDate(match.resultSubmittedAt),
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          winnerEntryId: match.winnerEntryId,
          matchStatus: match.matchStatus,
          bestOfFrames,
          homeHighBreaks: frameHighBreaks.homeHighBreaks,
          awayHighBreaks: frameHighBreaks.awayHighBreaks,
        }}
      />
    </section>
  );
}
