import SeasonForm from "../../SeasonForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};
import { prisma } from "@/lib/prisma";

export default async function EditSeasonPage({ params }: PageProps) {
  const { id } = await params;

  const leagues = await prisma.league.findMany({
    where: { isActive: true },
    orderBy: { leagueName: "asc" },
    select: {
      id: true,
      leagueName: true,
    },
  });

  return <SeasonForm mode="edit" seasonId={id} leagues={leagues} />;
}