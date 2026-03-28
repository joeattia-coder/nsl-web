import { redirect } from "next/navigation";

type TournamentsPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

export default async function TournamentsPage({ searchParams }: TournamentsPageProps) {
  const { id } = await searchParams;
  const tournamentId = Array.isArray(id) ? id[0] : id;

  if (tournamentId?.trim()) {
    redirect(`/tournaments/${tournamentId.trim()}`);
  }

  redirect("/competitions");
}