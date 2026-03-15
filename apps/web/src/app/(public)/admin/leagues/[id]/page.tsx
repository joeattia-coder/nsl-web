import LeagueForm from "../league-form";

export default async function EditLeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="admin-page">
      <LeagueForm mode="edit" leagueId={id} />
    </section>
  );
}
