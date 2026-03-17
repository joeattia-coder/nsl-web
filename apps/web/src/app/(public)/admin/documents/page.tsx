import { prisma } from "@/lib/prisma";
import { requireAnyAdminPermission } from "@/lib/admin-auth";
import DocumentsTable from "./documents-table";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  await requireAnyAdminPermission(["documents.view", "news.view"]);

  const documents = await prisma.document.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      fileUrl: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      showOnPublicDocumentsPage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Documents</h1>
        <p className="admin-page-subtitle">
          Upload and manage PDF and office documents for the public documents page.
        </p>
      </div>

      <DocumentsTable
        documents={documents.map((document) => ({
          ...document,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
        }))}
      />
    </section>
  );
}
