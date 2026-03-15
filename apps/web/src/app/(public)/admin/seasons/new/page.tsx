import SeasonForm from "../SeasonForm";
import { prisma } from "@/lib/prisma";

export default async function NewSeasonPage() {
  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    orderBy: { leagueName: "asc" },
    select: {
      id: true,
      leagueName: true,
    },
  });

  return <SeasonForm mode="create" leagues={leagues} />;
}