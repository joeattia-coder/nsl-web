"use client";

import { useMemo, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import {
  SortableHeader,
  sortRows,
  type SortDirection,
} from "@/lib/admin-table-sorting";
import type { AboutVersionRow } from "./about-form";

type AboutHistoryTableProps = {
  versions: AboutVersionRow[];
};

type SortKey = "title" | "publishedAt" | "createdAt";

export default function AboutHistoryTable({ versions }: AboutHistoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("publishedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedVersions = useMemo(() => {
    return sortRows(
      versions,
      (version) => {
        switch (sortKey) {
          case "title":
            return version.title;
          case "createdAt":
            return version.createdAt;
          case "publishedAt":
          default:
            return version.publishedAt;
        }
      },
      sortDirection
    );
  }, [sortDirection, sortKey, versions]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setError(null);

      const response = await fetch(`/api/about/${id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to delete About history entry.");
      }

      window.location.reload();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete About history entry."
      );
    } finally {
      setDeletingId(null);
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
                    label="Published"
                    columnKey="publishedAt"
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
                  <th>Status</th>
                  <th className="admin-players-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedVersions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-players-empty">
                      No About history entries yet.
                    </td>
                  </tr>
                ) : (
                  sortedVersions.map((version) => (
                    <tr key={version.id}>
                      <td>
                        <div className="flex min-w-[220px] flex-col gap-1">
                          <span className="font-semibold text-slate-900">{version.title}</span>
                          <span className="text-xs text-slate-500 line-clamp-2">
                            {version.subtitle || "No subtitle"}
                          </span>
                        </div>
                      </td>
                      <td>{version.publishedAtLabel}</td>
                      <td>{version.createdAtLabel}</td>
                      <td>{version.isLatest ? "Current" : "Archived"}</td>
                      <td>
                        {version.isLatest ? (
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="admin-icon-action admin-icon-action-delete"
                            aria-label={`Delete archived about version from ${version.publishedAt}`}
                            title="Delete archived version"
                            onClick={() => void handleDelete(version.id)}
                            disabled={deletingId === version.id}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}