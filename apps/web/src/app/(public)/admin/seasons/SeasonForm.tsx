"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiPlus, FiSave, FiX } from "react-icons/fi";

type SeasonFormMode = "create" | "edit";

type Season = {
  id: string;
  seasonName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean | null;
  leagueId?: string | null;
};

type LeagueOption = {
  id: string;
  leagueName: string;
};

type SeasonFormProps = {
  mode: SeasonFormMode;
  seasonId?: string;
  leagues: LeagueOption[];
};

export default function SeasonForm({
  mode,
  seasonId,
  leagues,
}: SeasonFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [seasonName, setSeasonName] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isEdit || !seasonId) {
      setLoading(false);
      return;
    }

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
          throw new Error(
            (data as { details?: string; error?: string } | null)?.details ||
              (data as { error?: string } | null)?.error ||
              "Failed to fetch season."
          );
        }

        const season = data as Season;

        setSeasonName(season.seasonName ?? "");
        setLeagueId(season.leagueId ?? "");
        setStartDate(season.startDate ? String(season.startDate).slice(0, 10) : "");
        setEndDate(season.endDate ? String(season.endDate).slice(0, 10) : "");
        setIsActive(season.isActive ?? true);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load season."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSeason();
  }, [isEdit, seasonId]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const trimmedSeasonName = seasonName.trim();

    if (!leagueId) {
      setError("Please select a league.");
      return;
    }

    if (!trimmedSeasonName) {
      setError("Season name is required.");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("End date must be the same as or later than the start date.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        seasonName: trimmedSeasonName,
        leagueId,
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
          {error ? <p className="admin-form-error">{error}</p> : <p>Loading season...</p>}
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
              ? "Update the season name, league, dates, and status."
              : "Create a new season within a league for tournaments and standings."}
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
                  onChange={(event) => setSeasonName(event.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="e.g. 2025 / 2026"
                  required
                />
              </div>

              <div className="admin-form-field">
                <label htmlFor="leagueId" className="admin-label">
                  League
                </label>
                <select
                  id="leagueId"
                  value={leagueId}
                  onChange={(event) => setLeagueId(event.target.value)}
                  className="admin-input admin-player-form-input"
                  required
                >
                  <option value="">Select a league</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.leagueName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Season Status</label>
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                  />
                  <span>Season is active</span>
                </label>
              </div>

              <div className="admin-form-field">
                <label htmlFor="startDate" className="admin-label">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
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
                  onChange={(event) => setEndDate(event.target.value)}
                  className="admin-input admin-player-form-input"
                />
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