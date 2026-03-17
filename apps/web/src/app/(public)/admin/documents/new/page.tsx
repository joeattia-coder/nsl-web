import DocumentForm from "../document-form";
import { requireAnyAdminPermission } from "@/lib/admin-auth";

export default async function NewDocumentPage() {
  await requireAnyAdminPermission(["documents.create", "news.create"]);

  return <DocumentForm mode="create" />;
}
