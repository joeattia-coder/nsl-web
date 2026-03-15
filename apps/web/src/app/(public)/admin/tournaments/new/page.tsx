import { prisma } from "@/lib/prisma";
import TournamentForm from "../TournamentForm";

export default async function NewTournamentPage() {
  const [seasons, venues] = await Promise.all([
    prisma.season.findMany({
      orderBy: [{ startDate: "desc" }, { seasonName: "asc" }],
      select: {
        id: true,
        seasonName: true,
      },
    }),
    prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { venueName: "asc" },
      select: {
        id: true,
        venueName: true,
      },
    }),
  ]);

  return <TournamentForm mode="create" seasons={seasons} venues={venues} />;
}