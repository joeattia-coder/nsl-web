import SeasonForm from "../../SeasonForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSeasonPage({ params }: PageProps) {
  const { id } = await params;
  return <SeasonForm mode="edit" seasonId={id} />;
}