import { notFound } from "next/navigation";
import {
  buildLeagueAdminPermissionScopes,
  requireScopedAdminPermission,
} from "@/lib/admin-auth";
import LeagueForm from "../league-form";

export default async function EditLeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  await requireScopedAdminPermission("leagues.edit", buildLeagueAdminPermissionScopes(id));

  return (
    <section className="admin-page">
      <LeagueForm mode="edit" leagueId={id} />
    </section>
  );
}
