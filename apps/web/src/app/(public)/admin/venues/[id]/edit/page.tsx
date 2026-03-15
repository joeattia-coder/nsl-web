import VenueForm from "../../venue-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditVenuePage({ params }: PageProps) {
  const { id } = await params;
  return <VenueForm mode="edit" venueId={id} />;
}