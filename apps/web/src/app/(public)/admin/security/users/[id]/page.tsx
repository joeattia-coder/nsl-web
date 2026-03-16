import { requireAdminPermission } from "@/lib/admin-auth";
import UserForm from "../user-form";

export default async function EditSecurityUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requireAdminPermission("users.edit");
  const { id } = await params;

  return <UserForm mode="edit" userId={id} canAssignGlobalAdmin={currentUser.isGlobalAdmin} />;
}