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

export type VideoRow = {
  id: string;
  title: string;
  sourceType: "YOUTUBE" | "UPLOAD";
  showInCarousel: boolean;
  carouselSortOrder: number;
  updatedAt: string;
};

type VideosTableProps = {
  videos: VideoRow[];
};

type SortKey = "title" | "sourceType" | "carousel" | "updatedAt";

export default function VideosTable({ videos }: VideosTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("carousel");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [videoToDelete, setVideoToDelete] = useState<VideoRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredVideos = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? videos
      : videos.filter((video) => {
          return (
            video.title.toLowerCase().includes(term) ||
            video.sourceType.toLowerCase().includes(term) ||
            String(video.carouselSortOrder).includes(term)
          );
        });

    return sortRows(
      rows,
      (video) => {
        switch (sortKey) {
          case "sourceType":
            return video.sourceType === "YOUTUBE" ? "YouTube" : "Uploaded File";
          case "carousel":
            return `${video.showInCarousel ? 0 : 1}-${video.carouselSortOrder}`;
          case "updatedAt":
            return video.updatedAt;
          case "title":
          default:
            return video.title;
        }
      },
      sortDirection
    );
  }, [search, sortDirection, sortKey, videos]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/videos/${videoToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to delete video.");
      }

      window.location.reload();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete video.");
    } finally {
      setDeleting(false);
      setVideoToDelete(null);
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
              placeholder="Search videos..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="admin-players-toolbar-right">
            <Link href="/admin/videos/new" className="admin-toolbar-button admin-toolbar-button-add">
              <FiPlus />
              <span>Add Video</span>
            </Link>
          </div>
        </div>

        <div className="admin-players-table-shell">
          <div className="admin-players-table-wrap">
            <table className="admin-table admin-players-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Video"
                    columnKey="title"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Source"
                    columnKey="sourceType"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Carousel"
                    columnKey="carousel"
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
                {filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-players-empty">
                      No videos found.
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map((video) => (
                    <tr key={video.id}>
                      <td>
                        <div className="flex min-w-[220px] flex-col gap-1">
                          <Link href={`/admin/videos/${video.id}`} className="font-semibold text-slate-900">
                            {video.title}
                          </Link>
                          <span className="text-xs text-slate-500">Order: {video.carouselSortOrder}</span>
                        </div>
                      </td>
                      <td>{video.sourceType === "YOUTUBE" ? "YouTube" : "Uploaded File"}</td>
                      <td>{video.showInCarousel ? "Shown" : "Hidden"}</td>
                      <td>
                        {formatDateInAdminTimeZone(video.updatedAt) || "-"}
                      </td>
                      <td>
                        <div className="admin-player-row-actions">
                          <Link
                            href={`/admin/videos/${video.id}`}
                            className="admin-icon-action admin-icon-action-edit"
                            aria-label={`Edit ${video.title}`}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Link>
                          <button
                            type="button"
                            className="admin-icon-action admin-icon-action-delete"
                            aria-label={`Delete ${video.title}`}
                            title="Delete"
                            onClick={() => setVideoToDelete(video)}
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

      {videoToDelete ? (
        <div className="admin-modal-backdrop" onClick={() => setVideoToDelete(null)} role="presentation">
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-delete-title"
          >
            <h2 id="video-delete-title" className="admin-modal-title">
              Delete video?
            </h2>
            <p className="admin-modal-text">
              You are about to delete <strong>{videoToDelete.title}</strong>. This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => setVideoToDelete(null)}
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