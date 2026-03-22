"use client";

import { useState } from "react";
import { FiSave } from "react-icons/fi";
import NewsRichTextEditor from "@/components/admin/NewsRichTextEditor";

export type AboutVersionRow = {
  id: string;
  title: string;
  subtitle: string | null;
  contentHtml: string;
  contentJson: unknown;
  publishedAt: string;
  publishedAtLabel: string;
  createdAt: string;
  createdAtLabel: string;
  isLatest: boolean;
};

type AboutFormProps = {
  initialTitle: string;
  initialSubtitle: string;
  initialContentHtml: string;
  initialContentJson: unknown;
};

export default function AboutForm({
  initialTitle,
  initialSubtitle,
  initialContentHtml,
  initialContentJson,
}: AboutFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [contentHtml, setContentHtml] = useState(initialContentHtml);
  const [contentJson, setContentJson] = useState<unknown>(initialContentJson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/about", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subtitle,
          contentHtml,
          contentJson,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to save About content.");
      }

      window.location.reload();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to save About content.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-card admin-player-form-card admin-venue-form-card-left">
      <form onSubmit={handleSubmit} className="admin-form">
        {error ? <p className="admin-form-error">{error}</p> : null}

        <div className="admin-form-grid">
          <div className="admin-form-field admin-form-field-full">
            <label htmlFor="about-title" className="admin-label">
              Title
            </label>
            <input
              id="about-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="admin-input admin-player-form-input"
              placeholder="The National Snooker League"
              required
            />
          </div>

          <div className="admin-form-field admin-form-field-full">
            <label htmlFor="about-subtitle" className="admin-label">
              Subtitle
            </label>
            <textarea
              id="about-subtitle"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              className="admin-input admin-player-form-input min-h-[100px]"
              placeholder="Short supporting copy shown under the About title"
            />
          </div>

          <div className="admin-form-field admin-form-field-full">
            <label className="admin-label">About Body</label>
            <NewsRichTextEditor
              initialContent={initialContentHtml}
              placeholder="Write the About section here..."
              statusLabel="Formatted About content"
              onChange={({ html, json }) => {
                setContentHtml(html);
                setContentJson(json);
              }}
            />
          </div>
        </div>

        <div className="admin-form-actions admin-player-form-actions">
          <button
            type="submit"
            className="admin-player-form-button admin-player-form-button-primary"
            disabled={saving}
          >
            <FiSave />
            <span>{saving ? "Saving..." : "Save New About Version"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}