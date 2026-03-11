"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { FiPlus, FiTrash2, FiUserPlus } from "react-icons/fi";

type EntryRow = {
  id: string;
  displayName: string;
  seedNumber: number | null;
  memberNames: string[];
};

type PlayerOption = {
  id: string;
  fullName: string;
  email: string;
  alreadyRegistered: boolean;
};

type TournamentEntriesManagerProps = {
  tournamentId: string;
  participantType: string;
  entries: EntryRow[];
  players: PlayerOption[];
};

export default function TournamentEntriesManager({
  tournamentId,
  participantType,
  entries,
  players,
}: TournamentEntriesManagerProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const [addingExisting, setAddingExisting] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const [existingPlayerId, setExistingPlayerId] = useState("");
  const [existingEntryName, setExistingEntryName] = useState("");
  const [existingSeedNumber, setExistingSeedNumber] = useState("");

  const [newFirstName, setNewFirstName] = useState("");
  const [newMiddleInitial, setNewMiddleInitial] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newEntryName, setNewEntryName] = useState("");
  const [newSeedNumber, setNewSeedNumber] = useState("");

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter((entry) => {
      return (
        entry.displayName.toLowerCase().includes(term) ||
        entry.memberNames.some((name) => name.toLowerCase().includes(term)) ||
        String(entry.seedNumber ?? "").includes(term)
      );
    });
  }, [entries, search]);

  async function handleAddExisting(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!existingPlayerId) {
      setActionError("Select a player to add.");
      return;
    }

    try {
      setAddingExisting(true);
      setActionError(null);

      const res = await fetch(`/api/tournaments/${tournamentId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "existing",
          playerId: existingPlayerId,
          entryName: existingEntryName.trim() || null,
          seedNumber: existingSeedNumber.trim() ? Number(existingSeedNumber) : null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to add tournament entry."
        );
      }

      setExistingPlayerId("");
      setExistingEntryName("");
      setExistingSeedNumber("");
      router.refresh();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to add tournament entry."
      );
    } finally {
      setAddingExisting(false);
    }
  }

  async function handleCreateNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newFirstName.trim() || !newLastName.trim()) {
      setActionError("First name and last name are required.");
      return;
    }

    try {
      setCreatingNew(true);
      setActionError(null);

      const res = await fetch(`/api/tournaments/${tournamentId}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "new",
          player: {
            firstName: newFirstName.trim(),
            middleInitial: newMiddleInitial.trim() || null,
            lastName: newLastName.trim(),
            emailAddress: newEmail.trim() || null,
            phoneNumber: newPhoneNumber.trim() || null,
            country: newCountry.trim() || null,
          },
          entryName: newEntryName.trim() || null,
          seedNumber: newSeedNumber.trim() ? Number(newSeedNumber) : null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            "Failed to create player and register entry."
        );
      }

      setNewFirstName("");
      setNewMiddleInitial("");
      setNewLastName("");
      setNewEmail("");
      setNewPhoneNumber("");
      setNewCountry("");
      setNewEntryName("");
      setNewSeedNumber("");
      router.refresh();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to create player and register entry."
      );
    } finally {
      setCreatingNew(false);
    }
  }

  async function handleDeleteEntry(entryId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this entry from the tournament?"
    );

    if (!confirmed) return;

    try {
      setDeletingEntryId(entryId);
      setActionError(null);

      const res = await fetch(`/api/tournament-entries/${entryId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament entry."
        );
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete tournament entry."
      );
    } finally {
      setDeletingEntryId(null);
    }
  }

  return (
    <>
      {actionError ? (
        <div className="admin-form-error" style={{ marginBottom: "14px" }}>
          {actionError}
        </div>
      ) : null}

      <div className="admin-card" style={{ marginTop: 0 }}>
        <form onSubmit={handleAddExisting} className="admin-form">
          <div className="admin-page-header" style={{ marginBottom: "12px" }}>
            <div>
              <h2 className="admin-page-title" style={{ fontSize: "1.3rem" }}>
                Add Existing Player
              </h2>
              <p className="admin-page-subtitle">
                Register a player from the master player database into this tournament.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-label">Player</label>
              <select
                value={existingPlayerId}
                onChange={(e) => setExistingPlayerId(e.target.value)}
                className="admin-select admin-player-form-input"
                required
              >
                <option value="">Select player</option>
                {players.map((player) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={player.alreadyRegistered}
                  >
                    {player.fullName}
                    {player.email ? ` (${player.email})` : ""}
                    {player.alreadyRegistered ? " — already registered" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Entry Name (optional)</label>
              <input
                type="text"
                value={existingEntryName}
                onChange={(e) => setExistingEntryName(e.target.value)}
                className="admin-input admin-player-form-input"
                placeholder={
                  participantType === "Singles"
                    ? "Leave blank to use player name"
                    : "Entry name"
                }
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Seed Number (optional)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={existingSeedNumber}
                onChange={(e) => setExistingSeedNumber(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>
          </div>

          <div className="admin-form-actions admin-player-form-actions">
            <button
              type="submit"
              className="admin-player-form-button admin-player-form-button-create"
              disabled={addingExisting}
            >
              <FiPlus />
              <span>{addingExisting ? "Adding..." : "Add Entry"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <form onSubmit={handleCreateNew} className="admin-form">
          <div className="admin-page-header" style={{ marginBottom: "12px" }}>
            <div>
              <h2 className="admin-page-title" style={{ fontSize: "1.3rem" }}>
                Create New Player and Register
              </h2>
              <p className="admin-page-subtitle">
                Create a new player from inside this tournament and register them immediately.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-label">First Name</label>
              <input
                type="text"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                className="admin-input admin-player-form-input"
                required
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Middle Initial</label>
              <input
                type="text"
                maxLength={1}
                value={newMiddleInitial}
                onChange={(e) => setNewMiddleInitial(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Last Name</label>
              <input
                type="text"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="admin-input admin-player-form-input"
                required
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Phone Number</label>
              <input
                type="text"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Country</label>
              <input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Entry Name (optional)</label>
              <input
                type="text"
                value={newEntryName}
                onChange={(e) => setNewEntryName(e.target.value)}
                className="admin-input admin-player-form-input"
                placeholder={
                  participantType === "Singles"
                    ? "Leave blank to use player name"
                    : "Entry name"
                }
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-label">Seed Number (optional)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={newSeedNumber}
                onChange={(e) => setNewSeedNumber(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>
          </div>

          <div className="admin-form-actions admin-player-form-actions">
            <button
              type="submit"
              className="admin-player-form-button admin-player-form-button-create"
              disabled={creatingNew}
            >
              <FiUserPlus />
              <span>
                {creatingNew ? "Creating..." : "Create Player and Register"}
              </span>
            </button>
          </div>
        </form>
      </div>

      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <th>Entry</th>
                <th>Members</th>
                <th>Seed</th>
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-players-empty">
                    No tournament entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className="admin-player-full-name">
                        {entry.displayName}
                      </span>
                    </td>
                    <td>{entry.memberNames.join(" / ") || "—"}</td>
                    <td>{entry.seedNumber ?? "—"}</td>
                    <td>
                      <div className="admin-player-row-actions">
                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          title="Delete"
                          aria-label={`Delete ${entry.displayName}`}
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={deletingEntryId === entry.id}
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
    </>
  );
}