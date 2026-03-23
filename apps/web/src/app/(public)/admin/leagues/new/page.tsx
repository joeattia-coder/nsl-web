import { requireAdminPermission } from "@/lib/admin-auth";
import LeagueForm from "../league-form";

export default async function NewLeaguePage() {
  await requireAdminPermission("leagues.create");

  return (
    <section className="admin-page">
      <LeagueForm mode="create" />
    </section>
  );
}
