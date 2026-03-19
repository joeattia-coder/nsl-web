"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaRegFilePdf } from "react-icons/fa6";
import { FiFileText, FiX } from "react-icons/fi";
import styles from "./DocumentsPage.module.css";

type DocumentItem = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  sizeLabel: string;
  updatedAtLabel: string;
};

type DocumentsGalleryProps = {
  documents: DocumentItem[];
};

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

function isPdfDocument(fileName: string | null, mimeType: string | null) {
  const lowerName = (fileName || "").toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  return lowerMime.includes("pdf") || lowerName.endsWith(".pdf");
}

export function DocumentsGallery({ documents }: DocumentsGalleryProps) {
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!activeDocument) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDocument(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDocument]);

  return (
    <>
      <div className={styles.documentsList}>
        {documents.map((document) => {
          const fileTypeLabel = getFileTypeBadgeLabel(document.fileName, document.mimeType);
          const isPdf = isPdfDocument(document.fileName, document.mimeType);

          return (
            <button
              key={document.id}
              type="button"
              className={styles.documentRow}
              onClick={() => setActiveDocument(document)}
            >
              <div className={styles.documentIconShell}>
                {isPdf ? (
                  <FaRegFilePdf className={styles.documentIcon} aria-hidden="true" />
                ) : (
                  <FiFileText className={styles.documentIcon} aria-hidden="true" />
                )}
              </div>

              <div className={styles.documentMeta}>
                <div className={styles.documentHeader}>
                  <span
                    className={styles.fileTypeBadge}
                    aria-label={isPdf ? "PDF document" : `${fileTypeLabel} document`}
                  >
                    {isPdf ? <FaRegFilePdf aria-hidden="true" /> : fileTypeLabel}
                  </span>
                  <span className={styles.documentDate}>{document.updatedAtLabel}</span>
                </div>

                <span className={styles.documentTitle}>{document.title}</span>

                <div className={styles.documentSubMeta}>
                  <span className={styles.fileDetailText}>{document.fileName || "Document"}</span>
                  <span className={styles.fileDetailDivider}>•</span>
                  <span className={styles.fileDetailText}>{document.sizeLabel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isMounted && activeDocument
        ? createPortal(
            <div
              className={styles.documentModalOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Document viewer"
            >
              <button
                type="button"
                className={styles.documentModalCloseButton}
                onClick={() => setActiveDocument(null)}
                aria-label="Close document viewer"
              >
                <FiX aria-hidden="true" />
              </button>

              <div className={styles.documentModalFrame}>
                <iframe
                  key={activeDocument.id}
                  src={activeDocument.fileUrl}
                  title="Document viewer"
                  className={styles.documentViewerIframe}
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}