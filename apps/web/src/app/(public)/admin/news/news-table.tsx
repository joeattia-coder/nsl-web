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

export type NewsRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  showOnHomePage: boolean;
  homePlacement: string | null;
  homeDisplayMode: string | null;
  homeSortOrder: number;
  publishedAt: string | null;
  updatedAt: string;
};

type NewsTableProps = {
  articles: NewsRow[];
};

type SortKey = "title" | "status" | "homepage" | "updatedAt";

function formatPlacement(article: NewsRow) {
  if (!article.showOnHomePage || !article.homePlacement || !article.homeDisplayMode) {
    return "Not featured";
  }

  return `${article.homePlacement.replaceAll("_", " ")} • ${article.homeDisplayMode.replaceAll(
    "_",
    " "
  )}`;
}

export default function NewsTable({ articles }: NewsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [articleToDelete, setArticleToDelete] = useState<NewsRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? articles
      : articles.filter((article) => {
          return (
            article.title.toLowerCase().includes(term) ||
            article.slug.toLowerCase().includes(term) ||
            formatPlacement(article).toLowerCase().includes(term)
          );
        });

    return sortRows(
      rows,
      (article) => {
        switch (sortKey) {
          case "status":
            return article.status === "PUBLISHED" ? "Published" : "Draft";
          case "homepage":
            return formatPlacement(article);
          case "updatedAt":
            return article.updatedAt;
          case "title":
          default:
            return article.title;
        }
      },
      sortDirection
    );
  }, [articles, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/news/${articleToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to delete article.");
      }

      window.location.reload();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete article.");
    } finally {
      setDeleting(false);
      setArticleToDelete(null);
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
              placeholder="Search news articles..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="admin-players-toolbar-right">
            <Link href="/admin/news/new" className="admin-toolbar-button admin-toolbar-button-add">
              <FiPlus />
              <span>Add Article</span>
            </Link>
          </div>
        </div>

        <div className="admin-players-table-shell">
          <div className="admin-players-table-wrap">
            <table className="admin-table admin-players-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Article"
                    columnKey="title"
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
                    label="Homepage"
                    columnKey="homepage"
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
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-players-empty">
                      No news articles found.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <div className="flex min-w-[220px] flex-col gap-1">
                          <Link href={`/admin/news/${article.id}`} className="font-semibold text-slate-900">
                            {article.title}
                          </Link>
                          <span className="text-xs text-slate-500">/{article.slug}</span>
                        </div>
                      </td>
                      <td>{article.status === "PUBLISHED" ? "Published" : "Draft"}</td>
                      <td>{formatPlacement(article)}</td>
                      <td>
                        {formatDateInAdminTimeZone(article.updatedAt) || "-"}
                      </td>
                      <td>
                        <div className="admin-player-row-actions">
                          <Link
                            href={`/admin/news/${article.id}`}
                            className="admin-icon-action admin-icon-action-edit"
                            aria-label={`Edit ${article.title}`}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            type="button"
                            className="admin-icon-action admin-icon-action-delete"
                            aria-label={`Delete ${article.title}`}
                            title="Delete"
                            onClick={() => setArticleToDelete(article)}
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

      {articleToDelete ? (
        <div className="admin-modal-backdrop" onClick={() => setArticleToDelete(null)} role="presentation">
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-delete-title"
          >
            <h2 id="news-delete-title" className="admin-modal-title">
              Delete article?
            </h2>
            <p className="admin-modal-text">
              You are about to delete <strong>{articleToDelete.title}</strong>. This action cannot be
              undone.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => setArticleToDelete(null)}
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
