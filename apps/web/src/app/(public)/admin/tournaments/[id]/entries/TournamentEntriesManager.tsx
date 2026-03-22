"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { getFlagCdnUrl, normalizeCountryCode } from "@/lib/country";
import { FiPlus, FiTrash2, FiUserPlus } from "react-icons/fi";

type EntryRow = {
  id: string;
  displayName: string;
  countryName: string;
  countryCode: string;
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
  tournamentName: string;
  participantType: string;
  entries: EntryRow[];
  players: PlayerOption[];
};

type SortKey = "displayName" | "countryName" | "seedNumber";

export default function TournamentEntriesManager({
  tournamentId,
  tournamentName,
  participantType,
  entries,
  players,
}: TournamentEntriesManagerProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("displayName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
    shouldRefresh?: boolean;
  } | null>(null);

  const [addingExisting, setAddingExisting] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [deletingAllEntries, setDeletingAllEntries] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<EntryRow | null>(null);
  const [showDeleteAllEntriesModal, setShowDeleteAllEntriesModal] = useState(false);

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

  const sortedPlayers = useMemo(
    () =>
      sortRows(
        players,
        (player) => `${player.fullName} ${player.email}`,
        "asc"
      ),
    [players]
  );

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? entries
      : entries.filter((entry) => {
          return (
            entry.displayName.toLowerCase().includes(term) ||
            entry.countryName.toLowerCase().includes(term) ||
            entry.memberNames.some((name) => name.toLowerCase().includes(term)) ||
            String(entry.seedNumber ?? "").includes(term)
          );
        });

    return sortRows(
      rows,
      (entry) => {
        switch (sortKey) {
          case "countryName":
            return entry.countryName;
          case "seedNumber":
            return entry.seedNumber ?? null;
          case "displayName":
          default:
            return entry.displayName;
        }
      },
      sortDirection
    );
  }, [entries, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  async function handleAddExisting(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!existingPlayerId) {
      setFeedbackModal({
        title: "Player required",
        message: "Select a player before adding a tournament entry.",
      });
      return;
    }

    try {
      setAddingExisting(true);

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

      const selectedPlayerName =
        players.find((player) => player.id === existingPlayerId)?.fullName ??
        "The tournament entry";
      const entryLabel = existingEntryName.trim() || selectedPlayerName;

      setExistingPlayerId("");
      setExistingEntryName("");
      setExistingSeedNumber("");
      setFeedbackModal({
        title: "Add Entry Complete",
        message: `${entryLabel} was added successfully to ${tournamentName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setFeedbackModal({
        title: "Could not add entry",
        message:
          err instanceof Error ? err.message : "Failed to add tournament entry.",
      });
    } finally {
      setAddingExisting(false);
    }
  }

  async function handleCreateNew(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!newFirstName.trim() || !newLastName.trim()) {
      setFeedbackModal({
        title: "Player details required",
        message: "First name and last name are required to create a player.",
      });
      return;
    }

    try {
      setCreatingNew(true);

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

      const createdPlayerName = [
        newFirstName.trim(),
        newMiddleInitial.trim(),
        newLastName.trim(),
      ]
        .filter(Boolean)
        .join(" ");
      const entryLabel = newEntryName.trim() || createdPlayerName || "The tournament entry";

      setNewFirstName("");
      setNewMiddleInitial("");
      setNewLastName("");
      setNewEmail("");
      setNewPhoneNumber("");
      setNewCountry("");
      setNewEntryName("");
      setNewSeedNumber("");
      setFeedbackModal({
        title: "Create Player and Register Complete",
        message: `${entryLabel} was created and added successfully to ${tournamentName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setFeedbackModal({
        title: "Could not create player",
        message:
          err instanceof Error
            ? err.message
            : "Failed to create player and register entry.",
      });
    } finally {
      setCreatingNew(false);
    }
  }

  function openDeleteModal(entry: EntryRow) {
    setEntryToDelete(entry);
  }

  function closeDeleteModal() {
    if (deletingEntryId) return;
    setEntryToDelete(null);
  }

  function openDeleteAllEntriesModal() {
    setShowDeleteAllEntriesModal(true);
  }

  function closeDeleteAllEntriesModal() {
    if (deletingAllEntries) return;
    setShowDeleteAllEntriesModal(false);
  }

  async function handleDeleteEntry(entryId: string) {
    const entryName = entryToDelete?.displayName ?? "The tournament entry";

    try {
      setDeletingEntryId(entryId);

      const res = await fetch(`/api/tournament-entries/${entryId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament entry."
        );
      }

      setEntryToDelete(null);
      setFeedbackModal({
        title: "Delete Tournament Entry Complete",
        message: `${entryName} was deleted successfully from ${tournamentName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setEntryToDelete(null);
      setFeedbackModal({
        title: "Could not delete entry",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete tournament entry.",
      });
    } finally {
      setDeletingEntryId(null);
    }
  }

  async function handleDeleteAllEntries() {
    try {
      setDeletingAllEntries(true);

      const res = await fetch(`/api/tournaments/${tournamentId}/entries`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete tournament entries."
        );
      }

      setShowDeleteAllEntriesModal(false);
      setFeedbackModal({
        title: "Delete All Entries Complete",
        message: `Deleted ${data?.deletedCount ?? 0} entr${data?.deletedCount === 1 ? "y" : "ies"} from ${tournamentName}.`,
        shouldRefresh: true,
      });
    } catch (err) {
      console.error(err);
      setShowDeleteAllEntriesModal(false);
      setFeedbackModal({
        title: "Could not delete entries",
        message:
          err instanceof Error
            ? err.message
            : "Failed to delete tournament entries.",
      });
    } finally {
      setDeletingAllEntries(false);
    }
  }

  return (
    <>
      <div className="admin-tournament-entries-layout">
        <div className="admin-card admin-tournament-entries-list-card">
          <div className="admin-players-toolbar" style={{ marginBottom: "18px" }}>
            <div className="admin-players-toolbar-left">
              <input
                type="text"
                className="admin-search-input admin-players-search"
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="admin-players-toolbar-right">
              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-danger"
                onClick={openDeleteAllEntriesModal}
                disabled={entries.length === 0 || deletingAllEntries || deletingEntryId !== null}
              >
                <FiTrash2 />
                <span>Delete All Entries</span>
              </button>
            </div>
          </div>

          <div className="admin-players-table-shell">
            <div className="admin-players-table-wrap">
              <table className="admin-table admin-players-table">
                <thead>
                  <tr>
                    <SortableHeader
                      label="Name"
                      columnKey="displayName"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Country"
                      columnKey="countryName"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      className="admin-tournament-entry-centered-column"
                    />
                    <SortableHeader
                      label="Seed"
                      columnKey="seedNumber"
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      className="admin-tournament-entry-centered-column"
                    />
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
                    filteredEntries.map((entry) => {
                      const countryCode = entry.countryCode || normalizeCountryCode(entry.countryName);

                      return (
                        <tr key={entry.id}>
                          <td>
                            <span className="admin-player-full-name">
                              {entry.displayName}
                            </span>
                          </td>
                          <td className="admin-player-country-cell admin-tournament-entry-centered-cell">
                            {countryCode ? (
                              <Image
                                src={getFlagCdnUrl(countryCode, "w40") ?? ""}
                                alt={entry.countryName || countryCode}
                                width={40}
                                height={30}
                                className="admin-player-country-flag-img"
                                title={entry.countryName || countryCode}
                              />
                            ) : (
                              entry.countryName || "—"
                            )}
                          </td>
                          <td className="admin-tournament-entry-centered-cell">
                            {entry.seedNumber ?? "—"}
                          </td>
                          <td>
                            <div className="admin-player-row-actions">
                              <button
                                type="button"
                                className="admin-icon-action admin-icon-action-delete"
                                title="Delete"
                                aria-label={`Delete ${entry.displayName}`}
                                onClick={() => openDeleteModal(entry)}
                                disabled={deletingEntryId === entry.id}
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="admin-tournament-entries-form-stack">
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
                    {sortedPlayers.map((player) => (
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
        </div>
      </div>

      {entryToDelete ? (
        <div
          className="admin-modal-backdrop"
          onClick={closeDeleteModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="entry-delete-title"
          >
            <h2 id="entry-delete-title" className="admin-modal-title">
              Delete tournament entry?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete <strong>{entryToDelete.displayName}</strong>
              from <strong>{tournamentName}</strong>.
            </p>

            <p className="admin-modal-text">
              This action cannot be undone.
            </p>

            <p className="admin-modal-text">
              This will also remove the entry&apos;s group assignments. If generated matches
              still depend on this entry, delete the tournament matches first.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeDeleteModal}
                disabled={deletingEntryId === entryToDelete.id}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={() => handleDeleteEntry(entryToDelete.id)}
                disabled={deletingEntryId === entryToDelete.id}
              >
                {deletingEntryId === entryToDelete.id ? "Deleting..." : "Delete Entry"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteAllEntriesModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={closeDeleteAllEntriesModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="entries-delete-all-title"
          >
            <h2 id="entries-delete-all-title" className="admin-modal-title">
              Delete all tournament entries?
            </h2>

            <p className="admin-modal-text">
              If you proceed, this will permanently delete all <strong>{entries.length}</strong>{" "}
              entr{entries.length === 1 ? "y" : "ies"} from <strong>{tournamentName}</strong>.
            </p>

            <p className="admin-modal-text">
              This action cannot be undone.
            </p>

            <p className="admin-modal-text">
              This will also remove all group assignments for those entries. If
              generated matches still exist, delete the tournament matches first.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeDeleteAllEntriesModal}
                disabled={deletingAllEntries}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={handleDeleteAllEntries}
                disabled={deletingAllEntries}
              >
                {deletingAllEntries ? "Deleting..." : "Delete All Entries"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            const shouldRefresh = feedbackModal.shouldRefresh;
            setFeedbackModal(null);
            if (shouldRefresh) {
              router.refresh();
            }
          }}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="entries-feedback-title"
          >
            <h2 id="entries-feedback-title" className="admin-modal-title">
              {feedbackModal.title}
            </h2>

            <p className="admin-modal-text">{feedbackModal.message}</p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => {
                  const shouldRefresh = feedbackModal.shouldRefresh;
                  setFeedbackModal(null);
                  if (shouldRefresh) {
                    router.refresh();
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}