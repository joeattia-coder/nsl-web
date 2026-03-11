import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/players/${id}/edit`);
}