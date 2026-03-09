"use client";

import { useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PlayerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string;
};

const emptyForm: PlayerForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  photoUrl: "",
};

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPlayers() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/players", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch players");
      }

      const list = Array.isArray(data) ? data : Array.isArray(data.players) ? data.players : [];
      setPlayers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;

    return players.filter((player) => {
      const fullName = `${player.firstName ?? ""} ${player.lastName ?? ""}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (player.email ?? "").toLowerCase().includes(q) ||
        (player.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [players, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingPlayerId(null);
    setError("");
    setSuccess("");
  }

  function startEdit(player: Player) {
    setEditingPlayerId(player.id);
    setForm({
      firstName: player.firstName ?? "",
      lastName: player.lastName ?? "",
      email: player.email ?? "",
      phone: player.phone ?? "",
      photoUrl: player.photoUrl ?? "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        photoUrl: form.photoUrl.trim() || null,
      };

      if (!payload.firstName || !payload.lastName) {
        throw new Error("First name and last name are required");
      }

      const isEditing = !!editingPlayerId;

      const res = await fetch(
        isEditing ? `/api/players/${editingPlayerId}` : "/api/players",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Failed to ${isEditing ? "update" : "create"} player`);
      }

      setSuccess(isEditing ? "Player updated successfully." : "Player created successfully.");
      resetForm();
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this player?");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/players/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete player");
      }

      if (editingPlayerId === id) {
        resetForm();
      }

      setSuccess("Player deleted successfully.");
      await loadPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete player");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <h1 className="admin-page-title">Players</h1>
        <p className="admin-page-subtitle">
          Add, edit, and manage player profiles.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-label" htmlFor="firstName">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                className="admin-input"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label" htmlFor="lastName">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                className="admin-input"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="admin-input"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                className="admin-input"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label className="admin-label" htmlFor="photoUrl">
                Photo URL
              </label>
              <input
                id="photoUrl"
                name="photoUrl"
                className="admin-input"
                value={form.photoUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          {error ? <p className="admin-form-error">{error}</p> : null}
          {success ? <p className="admin-form-success">{success}</p> : null}

          <div className="admin-form-actions">
            <button type="submit" className="admin-button" disabled={saving}>
              {saving
                ? editingPlayerId
                  ? "Saving..."
                  : "Creating..."
                : editingPlayerId
                ? "Update Player"
                : "Add Player"}
            </button>

            {editingPlayerId ? (
              <button
                type="button"
                className="admin-button admin-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <h2 className="admin-section-title">Players List</h2>

          <input
            type="text"
            className="admin-input"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: "320px" }}
          />
        </div>

        {loading ? (
          <p>Loading players...</p>
        ) : filteredPlayers.length === 0 ? (
          <p>No players found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.id}>
                    <td>
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={`${player.firstName} ${player.lastName}`}
                          style={{
                            width: "44px",
                            height: "44px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            display: "block",
                          }}
                        />
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td>{player.firstName} {player.lastName}</td>
                    <td>{player.email || "-"}</td>
                    <td>{player.phone || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="admin-button admin-button-secondary"
                          onClick={() => startEdit(player)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-button admin-button-danger"
                          onClick={() => handleDelete(player.id)}
                          disabled={deletingId === player.id}
                        >
                          {deletingId === player.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}