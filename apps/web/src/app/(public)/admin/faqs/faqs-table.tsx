"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { formatDateInAdminTimeZone } from "@/lib/timezone";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

export type FaqRow = {
  id: string;
  question: string;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string;
};

type FaqsTableProps = {
  faqs: FaqRow[];
};

type SortKey = "question" | "status" | "sortOrder" | "updatedAt";

export default function FaqsTable({ faqs }: FaqsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sortOrder");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [faqToDelete, setFaqToDelete] = useState<FaqRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? faqs
      : faqs.filter((faq) => {
          return (
            faq.question.toLowerCase().includes(term) ||
            (faq.isPublished ? "published" : "draft").includes(term) ||
            String(faq.sortOrder).includes(term)
          );
        });

    return sortRows(
      rows,
      (faq) => {
        switch (sortKey) {
          case "status":
            return faq.isPublished ? "Published" : "Draft";
          case "sortOrder":
            return faq.sortOrder;
          case "updatedAt":
            return faq.updatedAt;
          case "question":
          default:
            return faq.question;
        }
      },
      sortDirection
    );
  }, [faqs, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const handleDelete = async () => {
    if (!faqToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/faqs/${faqToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to delete FAQ.");
      }

      window.location.reload();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete FAQ.");
    } finally {
      setDeleting(false);
      setFaqToDelete(null);
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
              placeholder="Search FAQs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="admin-players-toolbar-right">
            <Link href="/admin/faqs/new" className="admin-toolbar-button admin-toolbar-button-add">
              <FiPlus />
              <span>Add FAQ</span>
            </Link>
          </div>
        </div>

        <div className="admin-players-table-shell">
          <div className="admin-players-table-wrap">
            <table className="admin-table admin-players-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Question"
                    columnKey="question"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Status"
                    columnKey="status"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Order"
                    columnKey="sortOrder"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Updated"
                    columnKey="updatedAt"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="admin-players-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-players-empty">
                      No FAQs found.
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq) => (
                    <tr key={faq.id}>
                      <td>
                        <div className="flex min-w-[220px] flex-col gap-1">
                          <Link href={`/admin/faqs/${faq.id}`} className="font-semibold text-slate-900">
                            {faq.question}
                          </Link>
                        </div>
                      </td>
                      <td>{faq.isPublished ? "Published" : "Draft"}</td>
                      <td>{faq.sortOrder}</td>
                      <td>
                        {formatDateInAdminTimeZone(faq.updatedAt) || "-"}
                      </td>
                      <td>
                        <div className="admin-player-row-actions">
                          <Link
                            href={`/admin/faqs/${faq.id}`}
                            className="admin-icon-action admin-icon-action-edit"
                            aria-label={`Edit ${faq.question}`}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            type="button"
                            className="admin-icon-action admin-icon-action-delete"
                            aria-label={`Delete ${faq.question}`}
                            title="Delete"
                            onClick={() => setFaqToDelete(faq)}
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

      {faqToDelete ? (
        <div className="admin-modal-backdrop" onClick={() => setFaqToDelete(null)} role="presentation">
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-delete-title"
          >
            <h2 id="faq-delete-title" className="admin-modal-title">
              Delete FAQ?
            </h2>
            <p className="admin-modal-text">
              You are about to delete <strong>{faqToDelete.question}</strong>. This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => setFaqToDelete(null)}
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
