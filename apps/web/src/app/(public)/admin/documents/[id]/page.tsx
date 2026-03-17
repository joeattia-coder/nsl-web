import DocumentForm from "../document-form";
import { requireAnyAdminPermission } from "@/lib/admin-auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDocumentPage({ params }: PageProps) {
  await requireAnyAdminPermission(["documents.edit", "news.edit"]);

  const { id } = await params;

  return <DocumentForm mode="edit" documentId={id} />;
}
