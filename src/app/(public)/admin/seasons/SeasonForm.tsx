"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCalendar, FiPlus, FiSave, FiX } from "react-icons/fi";

type SeasonFormMode = "create" | "edit";

type Season = {
  id: string;
  seasonName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean | null;
};

type SeasonFormProps = {
  mode: SeasonFormMode;
  seasonId?: string;
};

export default function SeasonForm({ mode, seasonId }: SeasonFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isEdit || !seasonId) return;

    async function loadSeason() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/seasons/${seasonId}`, {
          cache: "no-store",
        });

        const data: Season | { error?: string; details?: string } | null =
          await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            (data as { details?: string; error?: string } | null)?.details ||
            (data as { error?: string } | null)?.error ||
            "Failed to fetch season.";
          throw new Error(message);
        }

        const season = data as Season;

        setSeasonName(season.seasonName ?? "");
        setStartDate(season.startDate ? String(season.startDate).slice(0, 10) : "");
        setEndDate(season.endDate ? String(season.endDate).slice(0, 10) : "");
        setIsActive(season.isActive ?? true);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load season.");
      } finally {
        setLoading(false);
      }
    }

    void loadSeason();
  }, [isEdit, seasonId]);

  const previewText = useMemo(() => {
    const name = seasonName.trim() || "New Season";
    const start = startDate || "—";
    const end = endDate || "—";
    return `${name} • ${start} to ${end}`;
  }, [seasonName, startDate, endDate]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const payload = {
        seasonName: seasonName.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        isActive,
      };

      const res = await fetch(
        isEdit ? `/api/seasons/${seasonId}` : "/api/seasons",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            (isEdit ? "Failed to update season." : "Failed to create season.")
        );
      }

      router.push("/admin/seasons");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update season."
            : "Failed to create season."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          <p>Loading season...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEdit ? "Edit Season" : "Add Season"}
          </h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update the season name, dates, and status."
              : "Create a new season for tournaments and standings."}
          </p>
        </div>

        <Link
          href="/admin/seasons"
          className="admin-player-form-button admin-player-form-button-secondary"
        >
          <FiArrowLeft />
          <span>Back to Seasons</span>
        </Link>
      </div>

      <div className="admin-venue-form-layout">
        <div className="admin-card admin-player-form-card admin-venue-form-card-left">
          <form onSubmit={handleSubmit} className="admin-form">
            {error ? <p className="admin-form-error">{error}</p> : null}

            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="seasonName" className="admin-label">
                  Season Name
                </label>
                <input
                  id="seasonName"
                  type="text"
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="e.g. 2025 / 2026"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="startDate" className="admin-label">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="admin-input admin-player-form-input"
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="endDate" className="admin-label">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="admin-input admin-player-form-input"
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Season Status</label>
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Season is active</span>
                </label>
              </div>
            </div>

            <div className="admin-form-actions admin-player-form-actions">
              <Link
                href="/admin/seasons"
                className="admin-player-form-button admin-player-form-button-secondary"
              >
                <FiX />
                <span>Cancel</span>
              </Link>

              <button
                type="submit"
                className={`admin-player-form-button ${
                  isEdit
                    ? "admin-player-form-button-primary"
                    : "admin-player-form-button-create"
                }`}
                disabled={saving}
              >
                {isEdit ? <FiSave /> : <FiPlus />}
                <span>
                  {saving
                    ? isEdit
                      ? "Saving..."
                      : "Creating..."
                    : isEdit
                      ? "Save Changes"
                      : "Save Season"}
                </span>
              </button>
            </div>
          </form>
        </div>

        
      </div>
    </div>
  );
}