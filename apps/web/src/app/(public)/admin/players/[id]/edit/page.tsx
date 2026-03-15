import PlayerForm from "../../player-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPlayerPage({ params }: PageProps) {
  const { id } = await params;

  return <PlayerForm mode="edit" playerId={id} />;
}