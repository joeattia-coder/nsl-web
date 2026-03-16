import { requireAdminPermission } from "@/lib/admin-auth";
import UserForm from "../user-form";

export default async function NewSecurityUserPage() {
  const currentUser = await requireAdminPermission("users.create");

  return <UserForm mode="create" canAssignGlobalAdmin={currentUser.isGlobalAdmin} />;
}