"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

export type DocumentRow = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  showOnPublicDocumentsPage: boolean;
  createdAt: string;
  updatedAt: string;
};

type DocumentsTableProps = {
  documents: DocumentRow[];
};

type SortKey = "title" | "showOnPublicDocumentsPage" | "createdAt" | "updatedAt";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

export default function DocumentsTable({ documents }: DocumentsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? documents
      : documents.filter((document) => {
          return (
            document.title.toLowerCase().includes(term) ||
            (document.fileName || "").toLowerCase().includes(term) ||
            (document.mimeType || "").toLowerCase().includes(term)
          );
        });

    return sortRows(
      rows,
      (document) => {
        switch (sortKey) {
          case "showOnPublicDocumentsPage":
            return document.showOnPublicDocumentsPage;
          case "createdAt":
            return document.createdAt;
          case "updatedAt":
            return document.updatedAt;
          case "title":
          default:
            return document.title;
        }
      },
      sortDirection
    );
  }, [documents, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection(columnKey === "createdAt" || columnKey === "updatedAt" ? "desc" : "asc");
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to delete document.");
      }

      window.location.reload();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete document.");
    } finally {
      setDeleting(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <>
      {error ? (
        <div className="admin-form-error" style={{ marginBottom: "14px" }}>
          {error}
        </div>
      ) : null}

      <div className="admin-table-wrapper">
        <div className="admin-players-toolbar">
          <div className="admin-players-toolbar-left">
            <input
              type="text"
              className="admin-search-input admin-players-search"
              placeholder="Search documents..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="admin-players-toolbar-right">
            <Link href="/admin/documents/new" className="admin-toolbar-button admin-toolbar-button-add">
              <FiPlus />
              <span>Add Document</span>
            </Link>
          </div>
        </div>

        <div className="admin-players-table-shell">
          <div className="admin-players-table-wrap">
            <table className="admin-table admin-players-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Title"
                    columnKey="title"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Show Public"
                    columnKey="showOnPublicDocumentsPage"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Created"
                    columnKey="createdAt"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Modified"
                    columnKey="updatedAt"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="admin-players-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-players-empty">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((document) => (
                    <tr key={document.id}>
                      <td>
                        <div className="flex min-w-[240px] flex-col gap-1">
                          <Link href={`/admin/documents/${document.id}`} className="font-semibold text-slate-900">
                            {document.title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
                              {getFileTypeBadgeLabel(document.fileName, document.mimeType)}
                            </span>
                            <span>{document.fileName || "Document file"}</span>
                            <span>•</span>
                            <span>{formatFileSize(document.sizeBytes)}</span>
                          </div>
                        </div>
                      </td>
                      <td>{document.showOnPublicDocumentsPage ? "Yes" : "No"}</td>
                      <td>{formatDate(document.createdAt)}</td>
                      <td>{formatDate(document.updatedAt)}</td>
                      <td>
                        <div className="admin-player-row-actions">
                          <Link
                            href={`/admin/documents/${document.id}`}
                            className="admin-icon-action admin-icon-action-edit"
                            aria-label={`Edit ${document.title}`}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            type="button"
                            className="admin-icon-action admin-icon-action-delete"
                            aria-label={`Delete ${document.title}`}
                            title="Delete"
                            onClick={() => setDocumentToDelete(document)}
                            disabled={deleting}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {documentToDelete ? (
        <div className="admin-modal-backdrop" onClick={() => setDocumentToDelete(null)} role="presentation">
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-delete-title"
          >
            <h2 id="document-delete-title" className="admin-modal-title">
              Delete document?
            </h2>
            <p className="admin-modal-text">
              You are about to delete <strong>{documentToDelete.title}</strong>. This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => setDocumentToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
