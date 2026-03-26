"use client";

import { useState } from "react";
import { FiSave } from "react-icons/fi";
import NewsRichTextEditor from "@/components/admin/NewsRichTextEditor";

export type PrivacyVersionRow = {
  id: string;
  title: string;
  contentHtml: string;
  contentJson: unknown;
  publishedAt: string;
  publishedAtLabel: string;
  createdAt: string;
  createdAtLabel: string;
  isLatest: boolean;
};

type PrivacyFormProps = {
  initialTitle: string;
  initialContentHtml: string;
  initialContentJson: unknown;
};

export default function PrivacyForm({
  initialTitle,
  initialContentHtml,
  initialContentJson,
}: PrivacyFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [contentHtml, setContentHtml] = useState(initialContentHtml);
  const [contentJson, setContentJson] = useState<unknown>(initialContentJson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/privacy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          contentHtml,
          contentJson,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to save Privacy Policy.");
      }

      window.location.reload();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to save Privacy Policy.");
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
            <label htmlFor="privacy-title" className="admin-label">
              Title
            </label>
            <input
              id="privacy-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="admin-input admin-player-form-input"
              placeholder="Privacy Policy"
              required
            />
          </div>

          <div className="admin-form-field admin-form-field-full">
            <label className="admin-label">Privacy Policy Body</label>
            <NewsRichTextEditor
              initialContent={initialContentHtml}
              placeholder="Write the Privacy Policy here..."
              statusLabel="Formatted Privacy Policy content"
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
            <span>{saving ? "Saving..." : "Save New Privacy Version"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}