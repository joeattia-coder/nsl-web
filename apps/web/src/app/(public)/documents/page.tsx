import { prisma } from "@/lib/prisma";
import { DocumentsGallery } from "./DocumentsGallery";
import styles from "./DocumentsPage.module.css";

export const dynamic = "force-dynamic";

function formatFileSize(sizeBytes: number | null) {
  if (!sizeBytes || sizeBytes <= 0) {
    return "Unknown size";
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = sizeBytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

export default async function PublicDocumentsPage() {
  const documents = await prisma.document.findMany({
    where: { showOnPublicDocumentsPage: true },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      fileUrl: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      updatedAt: true,
    },
  });

  return (
    <main className={styles.documentsPage}>
      <section className={styles.documentsSection}>
        <header className={styles.documentsHero}>
          <div className={styles.documentsHeroCopy}>
            <p className={styles.documentsEyebrow}>NSL Resources</p>
            <h1 className={styles.documentsTitle}>Documents</h1>
            <p className={styles.documentsSubtitle}>
              Download forms, guides, and official league documents from a cleaner public resource library.
            </p>
          </div>
        </header>

        {documents.length === 0 ? (
          <div className={styles.emptyState}>No documents available yet.</div>
        ) : (
          <section className={styles.documentsLibrarySection}>
            <div className={styles.documentsLibraryHeader}>
              <div>
                <p className={styles.documentsSectionLabel}>Library</p>
                <h2 className={styles.documentsSectionTitle}>Browse the current public document set.</h2>
              </div>
              <p className={styles.documentsSectionMeta}>
                {documents.length} {documents.length === 1 ? "document" : "documents"} available
              </p>
            </div>

            <DocumentsGallery
              documents={documents.map((document) => ({
                id: document.id,
                title: document.title,
                fileUrl: document.fileUrl,
                fileName: document.fileName,
                mimeType: document.mimeType,
                sizeLabel: formatFileSize(document.sizeBytes),
                updatedAt: document.updatedAt.toISOString(),
              }))}
            />
          </section>
        )}
      </section>
    </main>
  );
}
