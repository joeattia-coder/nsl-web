import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../TournamentSubnav";

export const dynamic = "force-dynamic";

export default async function TournamentGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = await params;

  const [tournament, firstRound] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, tournamentName: true },
    }),
    prisma.stageRound.findFirst({
      where: {
        tournamentStage: { tournamentId },
      },
      select: {
        id: true,
        tournamentStage: { select: { id: true } },
      },
      orderBy: [
        { tournamentStage: { sequence: "asc" } },
        { sequence: "asc" },
        { createdAt: "asc" },
      ],
    }),
  ]);

  if (!tournament) {
    notFound();
  }

  if (firstRound) {
    redirect(
      `/admin/tournaments/${tournamentId}/stages/${firstRound.tournamentStage.id}/rounds/${firstRound.id}/groups`
    );
  }

  // No stages/rounds yet — show a helpful fallback
  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          Create at least one stage and round before managing groups.
        </p>
      </div>

      <TournamentSubnav tournamentId={tournament.id} active="groups" />

      <div className="admin-card" style={{ maxWidth: "720px" }}>
        <p className="admin-page-subtitle" style={{ margin: 0 }}>
          Groups are managed within a round. Start by creating a stage and round.
        </p>
      </div>
    </section>
  );
}
