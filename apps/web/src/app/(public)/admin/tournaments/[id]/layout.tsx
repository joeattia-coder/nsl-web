import { notFound } from "next/navigation";
import {
  getTournamentAdminPermissionScopes,
  requireScopedAdminPermission,
} from "@/lib/admin-auth";

export default async function TournamentAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const permissionScopes = await getTournamentAdminPermissionScopes(id);

  if (!permissionScopes) {
    notFound();
  }

  await requireScopedAdminPermission("tournaments.view", permissionScopes);

  return children;
}