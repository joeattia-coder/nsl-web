import Link from "next/link";
import { prisma } from "@/lib/prisma";
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

function getFileTypeBadgeLabel(fileName: string | null, mimeType: string | null) {
  const lowerName = (fileName || "").toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) return "PDF";
  if (lowerMime.includes("word") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) return "DOC";
  if (lowerMime.includes("excel") || lowerMime.includes("spreadsheet") || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx")) return "XLS";
  if (lowerMime.includes("powerpoint") || lowerName.endsWith(".ppt") || lowerName.endsWith(".pptx")) return "PPT";
  if (lowerMime.includes("text/plain") || lowerName.endsWith(".txt")) return "TXT";

  return "FILE";
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
          <p className={styles.documentsEyebrow}>NSL Resources</p>
          <h1 className={styles.documentsTitle}>Documents</h1>
          <p className={styles.documentsSubtitle}>
            Download forms, guides, and official league documents.
          </p>
        </header>

        {documents.length === 0 ? (
          <div className={styles.emptyState}>No documents available yet.</div>
        ) : (
          <div className={styles.documentsList}>
            {documents.map((document) => (
              <Link
                key={document.id}
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.documentRow}
              >
                <div className={styles.documentMeta}>
                  <span className={styles.documentTitle}>{document.title}</span>
                  <div className={styles.documentSubMeta}>
                    <span className={styles.fileTypeBadge}>
                      {getFileTypeBadgeLabel(document.fileName, document.mimeType)}
                    </span>
                    <span className={styles.fileDetailText}>{document.fileName || "Document"}</span>
                    <span className={styles.fileDetailDivider}>•</span>
                    <span className={styles.fileDetailText}>{formatFileSize(document.sizeBytes)}</span>
                  </div>
                </div>
                <span className={styles.documentDate}>
                  {new Date(document.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
