"use client";

import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export type LeagueFormMode = "create" | "edit";

export type League = {
  id?: string;
  leagueName?: string;
  description?: string;
  isActive?: boolean;
  logoUrl?: string;
};

export type LeagueFormProps = {
  mode: LeagueFormMode;
  leagueId?: string;
};

export default function LeagueForm({ mode, leagueId }: LeagueFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [leagueName, setLeagueName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !leagueId) return;
    setLoading(true);
    fetch(`/api/leagues/${leagueId}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to load league.");
        }
        setLeagueName(data.leagueName ?? "");
        setDescription(data.description ?? "");
        setIsActive(data.isActive ?? true);
        setLogoUrl(data.logoUrl ?? "");
        setLogoPreview(data.logoUrl ?? "");
      })
      .catch(err => setError(err.message || "Failed to load league."))
      .finally(() => setLoading(false));
  }, [isEdit, leagueId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!leagueName.trim()) {
      setError("League name is required.");
      return;
    }
    setError("");
    setSaving(true);
    let uploadedLogoUrl = logoUrl;
    try {
      if (logoFile) {
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", logoFile);
        const uploadRes = await fetch("/api/upload/league-logo", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error("Failed to upload logo.");
        }
        uploadedLogoUrl = uploadData.url;
        setLogoUrl(uploadedLogoUrl);
        setUploadingLogo(false);
      }
      const payload = {
        leagueName,
        description,
        isActive,
        logoUrl: uploadedLogoUrl,
      };
      const res = await fetch(
        isEdit ? `/api/leagues/${leagueId}` : "/api/leagues",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const responseData = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          responseData?.details ||
            responseData?.error ||
            (isEdit ? "Failed to update league." : "Failed to create league.")
        );
      }
      router.push("/admin/leagues");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save league."
      );
    } finally {
      setSaving(false);
      setUploadingLogo(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          {error ? <p className="admin-form-error">{error}</p> : <p>Loading league...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEdit ? "Edit League" : "Add League"}
          </h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update league details, description, and logo."
              : "Create a new league for organizing seasons and tournaments."}
          </p>
        </div>
        <Link
          href="/admin/leagues"
          className="admin-player-form-button admin-player-form-button-secondary"
        >
          <FiArrowLeft />
          <span>Back to Leagues</span>
        </Link>
      </div>
      <div className="admin-venue-form-layout">
        <div className="admin-card admin-player-form-card admin-venue-form-card-left">
          <form onSubmit={handleSubmit} className="admin-form">
            {error ? <p className="admin-form-error">{error}</p> : null}
            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="leagueName" className="admin-label">
                  League Name
                </label>
                <input
                  id="leagueName"
                  type="text"
                  value={leagueName}
                  onChange={e => setLeagueName(e.target.value)}
                  className="admin-input admin-player-form-input"
                  required
                />
              </div>
              <div className="admin-form-field">
                <label htmlFor="isActive" className="admin-label">
                  League Status
                </label>
                <select
                  id="isActive"
                  value={isActive ? "active" : "inactive"}
                  onChange={e => setIsActive(e.target.value === "active")}
                  className="admin-input admin-player-form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="logoFile" className="admin-label">
                  League Logo
                </label>
                <label
                  htmlFor="logoFile"
                  className="admin-player-form-button admin-player-form-button-secondary admin-player-upload-trigger"
                  style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", marginBottom: 8 }}
                >
                  <span style={{ marginRight: 8 }}>Upload Logo</span>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16v-8m0 0l-4 4m4-4l4 4M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </label>
                <input
                  id="logoFile"
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setLogoFile(file);
                    if (file) {
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="admin-player-file-input"
                  style={{ display: "none" }}
                />
                <p className="admin-player-file-help">
                  JPG or PNG only. Maximum size: 4 MB.
                </p>
                {logoPreview ? (
                  <div className="admin-player-photo-preview">
                    <img
                      src={logoPreview}
                      alt="League logo preview"
                      width={88}
                      height={88}
                      className="admin-player-photo-preview-img"
                    />
                  </div>
                ) : logoUrl ? (
                  <div className="admin-player-photo-preview">
                    <img
                      src={logoUrl}
                      alt="League logo preview"
                      width={88}
                      height={88}
                      className="admin-player-photo-preview-img"
                    />
                  </div>
                ) : null}
              </div>
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="description" className="admin-label">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="admin-input admin-player-form-input"
                />
              </div>
            </div>
            <div className="admin-form-actions admin-player-form-actions">
              <Link
                href="/admin/leagues"
                className="admin-player-form-button admin-player-form-button-secondary"
              >
                <FiArrowLeft />
                <span>Cancel</span>
              </Link>
              <button
                type="submit"
                className={`admin-player-form-button admin-player-form-button-primary`}
                disabled={saving}
              >
                {saving
                  ? isEdit
                    ? "Saving..."
                    : "Adding..."
                  : isEdit
                  ? "Save Changes"
                  : "Add League"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
