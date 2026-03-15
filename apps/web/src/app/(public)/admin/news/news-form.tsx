"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiPlus, FiSave, FiUpload, FiX } from "react-icons/fi";
import NewsRichTextEditor from "@/components/admin/NewsRichTextEditor";
import {
  HOME_NEWS_DISPLAY_MODES,
  HOME_NEWS_PLACEMENTS,
  NEWS_STATUSES,
  slugifyNewsTitle,
} from "@/lib/news";

type NewsFormMode = "create" | "edit";

type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  contentJson: unknown;
  coverImageUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
  showOnHomePage: boolean;
  homePlacement: "SCROLLING_BANNER" | "NEWS_SECTION" | null;
  homeDisplayMode: "THUMBNAIL" | "TITLE" | "THUMBNAIL_TITLE" | null;
  homeSortOrder: number;
};

type NewsFormProps = {
  mode: NewsFormMode;
  articleId?: string;
};

export default function NewsForm({ mode, articleId }: NewsFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [contentJson, setContentJson] = useState<unknown>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [status, setStatus] = useState<(typeof NEWS_STATUSES)[number]>("DRAFT");
  const [showOnHomePage, setShowOnHomePage] = useState(false);
  const [homePlacement, setHomePlacement] = useState<(typeof HOME_NEWS_PLACEMENTS)[number]>(
    "SCROLLING_BANNER"
  );
  const [homeDisplayMode, setHomeDisplayMode] = useState<
    (typeof HOME_NEWS_DISPLAY_MODES)[number]
  >("THUMBNAIL_TITLE");
  const [homeSortOrder, setHomeSortOrder] = useState("0");

  useEffect(() => {
    if (!isEdit || !articleId) return;

    async function loadArticle() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/news/${articleId}`, { cache: "no-store" });
        const data: NewsArticle | { error?: string; details?: string } | null =
          await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (data as { details?: string; error?: string } | null)?.details ||
            (data as { error?: string } | null)?.error ||
            "Failed to fetch article.";
          throw new Error(message);
        }

        const article = data as NewsArticle;
        setTitle(article.title ?? "");
        setSlug(article.slug ?? "");
        setExcerpt(article.excerpt ?? "");
        setContentHtml(article.contentHtml ?? "<p></p>");
        setContentJson(article.contentJson ?? null);
        setCoverImageUrl(article.coverImageUrl ?? "");
        setStatus(article.status ?? "DRAFT");
        setShowOnHomePage(article.showOnHomePage ?? false);
        setHomePlacement(article.homePlacement ?? "SCROLLING_BANNER");
        setHomeDisplayMode(article.homeDisplayMode ?? "THUMBNAIL_TITLE");
        setHomeSortOrder(String(article.homeSortOrder ?? 0));
      } catch (loadError) {
        console.error(loadError);
        setError(loadError instanceof Error ? loadError.message : "Failed to load article.");
      } finally {
        setLoading(false);
      }
    }

    void loadArticle();
  }, [articleId, isEdit]);

  const slugPreview = useMemo(() => {
    const manualSlug = slug.trim();
    if (manualSlug) return slugifyNewsTitle(manualSlug);
    return slugifyNewsTitle(title) || "new-article";
  }, [slug, title]);

  const handleCoverUpload = async (file: File) => {
    try {
      setUploadingCover(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/news-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to upload cover image.");
      }

      setCoverImageUrl(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload cover image.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        contentHtml,
        contentJson,
        coverImageUrl: coverImageUrl.trim(),
        status,
        showOnHomePage,
        homePlacement: showOnHomePage ? homePlacement : null,
        homeDisplayMode: showOnHomePage ? homeDisplayMode : null,
        homeSortOrder,
      };

      const response = await fetch(isEdit ? `/api/news/${articleId}` : "/api/news", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.details || data?.error || (isEdit ? "Failed to update article." : "Failed to create article.")
        );
      }

      router.push("/admin/news");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEdit
            ? "Failed to update article."
            : "Failed to create article."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isEdit ? "Edit Article" : "Add Article"}</h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update your article content, imagery, and homepage promotion settings."
              : "Create a news article with rich text, images, and homepage placement controls."}
          </p>
        </div>

        <Link href="/admin/news" className="admin-player-form-button admin-player-form-button-secondary">
          <FiArrowLeft />
          <span>Back to News</span>
        </Link>
      </div>

      <div className="admin-venue-form-layout">
        <div className="admin-card admin-player-form-card admin-venue-form-card-left">
          <form onSubmit={handleSubmit} className="admin-form">
            {error ? <p className="admin-form-error">{error}</p> : null}

            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="news-title" className="admin-label">
                  Article Title
                </label>
                <input
                  id="news-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="Headline for the article"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="news-slug" className="admin-label">
                  Slug
                </label>
                <input
                  id="news-slug"
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="Optional custom URL slug"
                />
                <p className="mt-2 text-xs text-slate-500">URL preview: /news/{slugPreview}</p>
              </div>

              <div className="admin-form-field">
                <label htmlFor="news-status" className="admin-label">
                  Status
                </label>
                <select
                  id="news-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as (typeof NEWS_STATUSES)[number])}
                  className="admin-input admin-player-form-input"
                >
                  {NEWS_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option === "PUBLISHED" ? "Published" : "Draft"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="news-excerpt" className="admin-label">
                  Excerpt
                </label>
                <textarea
                  id="news-excerpt"
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  className="admin-input admin-player-form-input min-h-[110px]"
                  placeholder="Short summary used in article lists and homepage cards"
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label">Cover Image</label>
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <button
                    type="button"
                    className="admin-player-form-button admin-player-form-button-secondary"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    <FiUpload />
                    <span>{uploadingCover ? "Uploading..." : "Upload Cover Image"}</span>
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleCoverUpload(file);
                      }
                    }}
                  />
                  <input type="hidden" value={coverImageUrl} readOnly />
                  <div className="text-sm text-slate-500">
                    {coverImageUrl
                      ? "Cover image uploaded and attached to this article."
                      : "Upload a cover image to feature with this article."}
                  </div>
                </div>
                {coverImageUrl ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={coverImageUrl} alt="Cover preview" className="h-52 w-full object-cover" />
                  </div>
                ) : null}
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label">Article Body</label>
                <NewsRichTextEditor
                  initialContent={contentHtml}
                  onChange={({ html, json }) => {
                    setContentHtml(html);
                    setContentJson(json);
                  }}
                />
              </div>

              <div className="admin-form-field admin-form-field-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={showOnHomePage}
                    onChange={(event) => setShowOnHomePage(event.target.checked)}
                  />
                  <span>Feature this article on the home page</span>
                </label>

                {showOnHomePage ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="admin-form-field">
                      <label htmlFor="home-placement" className="admin-label">
                        Placement
                      </label>
                      <select
                        id="home-placement"
                        value={homePlacement}
                        onChange={(event) =>
                          setHomePlacement(event.target.value as (typeof HOME_NEWS_PLACEMENTS)[number])
                        }
                        className="admin-input admin-player-form-input"
                      >
                        {HOME_NEWS_PLACEMENTS.map((option) => (
                          <option key={option} value={option}>
                            {option === "SCROLLING_BANNER" ? "Scrolling Banner" : "News Section"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="home-display-mode" className="admin-label">
                        Display Mode
                      </label>
                      <select
                        id="home-display-mode"
                        value={homeDisplayMode}
                        onChange={(event) =>
                          setHomeDisplayMode(
                            event.target.value as (typeof HOME_NEWS_DISPLAY_MODES)[number]
                          )
                        }
                        className="admin-input admin-player-form-input"
                      >
                        {HOME_NEWS_DISPLAY_MODES.map((option) => (
                          <option key={option} value={option}>
                            {option === "THUMBNAIL_TITLE"
                              ? "Thumbnail and Title"
                              : option === "THUMBNAIL"
                                ? "Thumbnail Only"
                                : "Title Only"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="home-sort-order" className="admin-label">
                        Sort Order
                      </label>
                      <input
                        id="home-sort-order"
                        type="number"
                        value={homeSortOrder}
                        onChange={(event) => setHomeSortOrder(event.target.value)}
                        className="admin-input admin-player-form-input"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="admin-form-actions admin-player-form-actions">
              <Link href="/admin/news" className="admin-player-form-button admin-player-form-button-secondary">
                <FiX />
                <span>Cancel</span>
              </Link>
              <button
                type="submit"
                className={`admin-player-form-button ${
                  isEdit ? "admin-player-form-button-primary" : "admin-player-form-button-create"
                }`}
                disabled={saving}
              >
                {isEdit ? <FiSave /> : <FiPlus />}
                <span>
                  {saving ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Save Article"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
