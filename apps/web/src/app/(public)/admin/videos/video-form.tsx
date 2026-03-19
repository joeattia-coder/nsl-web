"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiPlus, FiSave, FiUpload, FiX } from "react-icons/fi";
import {
  extractYouTubeVideoId,
  getVideoPresentation,
  VIDEO_SOURCE_TYPES,
} from "@/lib/video-highlights";

type VideoFormMode = "create" | "edit";

type VideoHighlight = {
  id: string;
  title: string;
  sourceType: "YOUTUBE" | "UPLOAD";
  videoUrl: string;
  showInCarousel: boolean;
  carouselSortOrder: number;
};

type VideoFormProps = {
  mode: VideoFormMode;
  videoId?: string;
};

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
const MAX_FILE_SIZE = 200 * 1024 * 1024;

export default function VideoForm({ mode, videoId }: VideoFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<(typeof VIDEO_SOURCE_TYPES)[number]>("YOUTUBE");
  const [videoUrl, setVideoUrl] = useState("");
  const [showInCarousel, setShowInCarousel] = useState(true);
  const [carouselSortOrder, setCarouselSortOrder] = useState("0");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isEdit || !videoId) return;

    async function loadVideo() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/videos/${videoId}`, { cache: "no-store" });
        const data: VideoHighlight | { error?: string; details?: string } | null =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data as { details?: string; error?: string } | null)?.details ||
              (data as { error?: string } | null)?.error ||
              "Failed to fetch video."
          );
        }

        const video = data as VideoHighlight;
        setTitle(video.title ?? "");
        setSourceType(video.sourceType ?? "YOUTUBE");
        setVideoUrl(video.videoUrl ?? "");
        setShowInCarousel(Boolean(video.showInCarousel));
        setCarouselSortOrder(String(video.carouselSortOrder ?? 0));
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load video.");
      } finally {
        setLoading(false);
      }
    }

    void loadVideo();
  }, [isEdit, videoId]);

  const preview = useMemo(() => {
    if (!videoUrl.trim()) return null;
    return getVideoPresentation(sourceType, videoUrl.trim());
  }, [sourceType, videoUrl]);

  const youtubeHint = useMemo(() => {
    if (sourceType !== "YOUTUBE") return "";
    const id = extractYouTubeVideoId(videoUrl);
    return id ? `Video ID: ${id}` : "Paste a YouTube watch link, share link, shorts URL, or video ID.";
  }, [sourceType, videoUrl]);

  function handleVideoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setVideoFile(null);
      return;
    }

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError("Only MP4, WebM, OGG, and MOV files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Video is too large. Maximum size is 200 MB.");
      event.target.value = "";
      return;
    }

    setError(null);
    setVideoFile(file);
  }

  async function uploadVideoIfNeeded() {
    if (!videoFile) {
      return videoUrl.trim();
    }

    const formData = new FormData();
    formData.append("file", videoFile);

    setUploadingVideo(true);

    try {
      const response = await fetch("/api/upload/video-highlight", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to upload video.");
      }

      return String(data.url ?? "");
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const resolvedVideoUrl = sourceType === "UPLOAD" ? await uploadVideoIfNeeded() : videoUrl.trim();

      const payload = {
        title: title.trim(),
        sourceType,
        videoUrl: resolvedVideoUrl,
        showInCarousel,
        carouselSortOrder,
      };

      const response = await fetch(isEdit ? `/api/videos/${videoId}` : "/api/videos", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.details || data?.error || (isEdit ? "Failed to update video." : "Failed to create video.")
        );
      }

      router.push("/admin/videos");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEdit
            ? "Failed to update video."
            : "Failed to create video."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isEdit ? "Edit Video" : "Add Video"}</h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update your video source, homepage placement, and display order."
              : "Add a YouTube link or upload a highlight clip for the homepage carousel."}
          </p>
        </div>

        <Link href="/admin/videos" className="admin-player-form-button admin-player-form-button-secondary">
          <FiArrowLeft />
          <span>Back to Videos</span>
        </Link>
      </div>

      <div className="admin-venue-form-layout">
        <div className="admin-card admin-player-form-card admin-venue-form-card-left">
          <form onSubmit={handleSubmit} className="admin-form">
            {error ? <p className="admin-form-error">{error}</p> : null}

            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="video-title" className="admin-label">
                  Video Title
                </label>
                <input
                  id="video-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder={
                    sourceType === "YOUTUBE"
                      ? "Optional. Leave blank to use the YouTube title"
                      : "Headline shown under the video"
                  }
                  required={sourceType === "UPLOAD"}
                />
                {sourceType === "YOUTUBE" ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Leave this blank to pull the default title from YouTube when you save.
                  </p>
                ) : null}
              </div>

              <div className="admin-form-field">
                <label htmlFor="video-source-type" className="admin-label">
                  Source Type
                </label>
                <select
                  id="video-source-type"
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value as (typeof VIDEO_SOURCE_TYPES)[number])}
                  className="admin-input admin-player-form-input"
                >
                  <option value="YOUTUBE">YouTube Link</option>
                  <option value="UPLOAD">Upload Video File</option>
                </select>
              </div>

              <div className="admin-form-field">
                <label htmlFor="video-order" className="admin-label">
                  Carousel Order
                </label>
                <input
                  id="video-order"
                  type="number"
                  value={carouselSortOrder}
                  onChange={(event) => setCarouselSortOrder(event.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="0"
                />
              </div>

              <div className="admin-form-field admin-form-field-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={showInCarousel}
                    onChange={(event) => setShowInCarousel(event.target.checked)}
                  />
                  <span>Display this video in the Latest Video Highlights carousel</span>
                </label>
              </div>

              {sourceType === "YOUTUBE" ? (
                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="video-url" className="admin-label">
                    YouTube URL
                  </label>
                  <input
                    id="video-url"
                    type="url"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    className="admin-input admin-player-form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                  <p className="mt-2 text-xs text-slate-500">{youtubeHint}</p>
                </div>
              ) : (
                <div className="admin-form-field admin-form-field-full">
                  <label className="admin-label">Video File</label>
                  <div className="admin-upload-panel">
                    <button
                      type="button"
                      className="admin-player-form-button admin-player-form-button-secondary admin-player-form-button-upload"
                      onClick={() => uploadInputRef.current?.click()}
                      disabled={uploadingVideo}
                    >
                      <FiUpload />
                      <span>{videoFile ? "Change Video" : "Select Video"}</span>
                    </button>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      className="hidden"
                      onChange={handleVideoFileChange}
                    />
                    <div className="admin-upload-help">
                      {videoFile
                        ? `${videoFile.name} selected and ready to upload on save.`
                        : videoUrl
                          ? "An uploaded video is already attached to this highlight."
                          : "Upload MP4, WebM, OGG, or MOV video files up to 200 MB."}
                    </div>
                    {videoUrl ? (
                      <button
                        type="button"
                        className="admin-player-form-button admin-player-form-button-danger"
                        onClick={() => {
                          setVideoUrl("");
                          setVideoFile(null);
                          if (uploadInputRef.current) uploadInputRef.current.value = "";
                        }}
                      >
                        <FiX />
                        <span>Remove Video</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              {preview ? (
                <div className="admin-form-field admin-form-field-full">
                  <label className="admin-label">Preview</label>
                  <div className="video-card max-w-[420px]">
                    <div className="video-container">
                      {sourceType === "YOUTUBE" ? (
                        <iframe
                          src={preview.embedUrl}
                          title={title || "Video preview"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <video controls preload="metadata" playsInline>
                          <source src={preview.embedUrl} />
                        </video>
                      )}
                    </div>
                    <div className="video-title-link">{title || "Video title preview"}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="admin-form-actions admin-player-form-actions">
              <Link href="/admin/videos" className="admin-player-form-button admin-player-form-button-secondary">
                <FiX />
                <span>Cancel</span>
              </Link>
              <button
                type="submit"
                className={`admin-player-form-button ${
                  isEdit ? "admin-player-form-button-primary" : "admin-player-form-button-create"
                }`}
                disabled={saving || uploadingVideo}
              >
                {isEdit ? <FiSave /> : <FiPlus />}
                <span>
                  {uploadingVideo
                    ? "Uploading Video..."
                    : saving
                      ? isEdit
                        ? "Saving..."
                        : "Creating..."
                      : isEdit
                        ? "Save Changes"
                        : "Save Video"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}