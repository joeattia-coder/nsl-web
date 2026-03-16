import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../TournamentSubnav";

export const dynamic = "force-dynamic";

export default async function TournamentRoundsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = await params;

  const [tournament, firstStage] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        tournamentName: true,
      },
    }),
    prisma.tournamentStage.findFirst({
      where: { tournamentId },
      select: {
        id: true,
      },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!tournament) {
    notFound();
  }

  if (firstStage) {
    redirect(`/admin/tournaments/${tournamentId}/stages/${firstStage.id}/rounds`);
  }

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          Create at least one stage before managing rounds.
        </p>
      </div>

      <TournamentSubnav tournamentId={tournament.id} active="rounds" />

      <div className="admin-card" style={{ maxWidth: "720px" }}>
        <p className="admin-page-subtitle" style={{ margin: 0 }}>
          Rounds are managed within a stage. Start by creating a stage.
        </p>

        <div style={{ marginTop: "12px" }}>
          <Link
            href={`/admin/tournaments/${tournament.id}/stages`}
            className="admin-toolbar-button admin-toolbar-button-add"
          >
            Go to Stages
          </Link>
        </div>
      </div>
    </section>
  );
}
