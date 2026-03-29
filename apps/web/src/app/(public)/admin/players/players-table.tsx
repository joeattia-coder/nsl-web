"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";
import { getFlagCdnUrl, normalizeCountryCode } from "@/lib/country";
import type { AdminPlayerLiveSnapshot, AdminPlayersLiveResponse } from "@/lib/live-match";
import type { AdminPlayerInviteState } from "@/lib/admin-player-invitations";
import { useLivePolling } from "@/lib/useLivePolling";
import {
  FiCheckSquare,
  FiDownload,
  FiEdit2,
  FiMail,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiX,
} from "react-icons/fi";

type PlayerRow = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  photoUrl: string;
  linkedUserId: string | null;
  inviteState: AdminPlayerInviteState;
  inviteLabel: string;
  inviteMeta: string | null;
  inviteUpdatedAt: string | null;
  tournaments: Array<{
    id: string;
    name: string;
  }>;
};

type PlayersTableProps = {
  players: PlayerRow[];
};

type SortKey = "fullName" | "email" | "phoneNumber" | "country" | "tournaments" | "inviteLabel";

function sameTournaments(
  left: PlayerRow["tournaments"],
  right: AdminPlayerLiveSnapshot["tournaments"]
) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (tournament, index) =>
      tournament.id === right[index]?.id && tournament.name === right[index]?.name
  );
}

function applyLivePlayers(current: PlayerRow[], snapshots: AdminPlayerLiveSnapshot[]) {
  if (current.length === 0 && snapshots.length === 0) {
    return current;
  }

  if (current.length !== snapshots.length) {
    return snapshots.map((snapshot) => ({ ...snapshot }));
  }

  let changed = false;

  const next = snapshots.map((snapshot, index) => {
    const existing = current[index];

    if (
      existing &&
      existing.id === snapshot.id &&
      existing.fullName === snapshot.fullName &&
      existing.email === snapshot.email &&
      existing.phoneNumber === snapshot.phoneNumber &&
      existing.country === snapshot.country &&
      existing.photoUrl === snapshot.photoUrl &&
      existing.linkedUserId === snapshot.linkedUserId &&
      existing.inviteState === snapshot.inviteState &&
      existing.inviteLabel === snapshot.inviteLabel &&
      existing.inviteMeta === snapshot.inviteMeta &&
      existing.inviteUpdatedAt === snapshot.inviteUpdatedAt &&
      sameTournaments(existing.tournaments, snapshot.tournaments)
    ) {
      return existing;
    }

    changed = true;
    return { ...snapshot };
  });

  return changed ? next : current;
}

export default function PlayersTable({ players }: PlayersTableProps) {
  const [livePlayers, setLivePlayers] = useState(players);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerRow | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [invitingPlayerId, setInvitingPlayerId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLivePlayers(players);
  }, [players]);

  useEffect(() => {
    const livePlayerIds = new Set(livePlayers.map((player) => player.id));

    setSelectedIds((current) => {
      const next = current.filter((id) => livePlayerIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [livePlayers]);

  useLivePolling({
    enabled: livePlayers.length > 0,
    intervalMs: 3000,
    poll: async (signal) => {
      const response = await fetch("/api/admin/players/live", {
        signal,
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as AdminPlayersLiveResponse | null;

      if (!response.ok) {
        throw new Error(
          data && "error" in data
            ? String(data.error ?? "Failed to fetch live players.")
            : "Failed to fetch live players."
        );
      }

      setLivePlayers((current) => applyLivePlayers(current, data?.items ?? []));
    },
  });

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? livePlayers
      : livePlayers.filter((player) => {
          return (
            player.fullName.toLowerCase().includes(term) ||
            player.email.toLowerCase().includes(term) ||
            player.phoneNumber.toLowerCase().includes(term) ||
            player.country.toLowerCase().includes(term) ||
            player.inviteLabel.toLowerCase().includes(term) ||
            player.inviteMeta?.toLowerCase().includes(term) ||
            player.tournaments.some((tournament) =>
              tournament.name.toLowerCase().includes(term)
            )
          );
        });

    return sortRows(
      rows,
      (player) => {
        switch (sortKey) {
          case "email":
            return player.email;
          case "phoneNumber":
            return player.phoneNumber;
          case "country":
            return player.country;
          case "tournaments":
            return player.tournaments.map((tournament) => tournament.name).join(", ");
          case "inviteLabel":
            return `${player.inviteLabel} ${player.inviteUpdatedAt ?? ""}`;
          case "fullName":
          default:
            return player.fullName;
        }
      },
      sortDirection
    );
  }, [livePlayers, search, sortDirection, sortKey]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const visibleIds = filteredPlayers.map((player) => player.id);
  const selectedVisibleCount = visibleIds.filter((id) =>
    selectedIds.includes(id)
  ).length;

  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;

  const toggleBulkMode = () => {
    setBulkMode(true);
    setSelectedIds([]);
    setActionError(null);
    setActionSuccess(null);
  };

  const cancelBulkMode = () => {
    setBulkMode(false);
    setSelectedIds([]);
    setShowBulkDeleteModal(false);
    setActionError(null);
    setActionSuccess(null);
  };

  async function handleSendInvite(player: PlayerRow) {
    try {
      setInvitingPlayerId(player.id);
      setActionError(null);
      setActionSuccess(null);

      const response = await fetch(`/api/admin/players/${player.id}/invite`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; details?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.details || payload?.error || "Failed to send invitation."
        );
      }

      setLivePlayers((current) =>
        current.map((existing) =>
          existing.id === player.id
            ? {
                ...existing,
                inviteState: "invite-sent",
                inviteLabel: "Sent",
                inviteMeta: `Sent ${formatAdminDateLabel(new Date().toISOString())}`,
                inviteUpdatedAt: new Date().toISOString(),
              }
            : existing
        )
      );

      setActionSuccess(
        payload?.message || `Invitation sent to ${player.email || player.fullName}.`
      );
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to send invitation."
      );
    } finally {
      setInvitingPlayerId(null);
    }
  }

  const togglePlayerSelection = (playerId: string) => {
    setSelectedIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.includes(id))
      );
      return;
    }

    setSelectedIds((current) => {
      const merged = new Set([...current, ...visibleIds]);
      return Array.from(merged);
    });
  };

  const openBulkDeleteModal = () => {
    if (selectedIds.length === 0) return;
    setActionError(null);
    setShowBulkDeleteModal(true);
  };

  const closeBulkDeleteModal = () => {
    if (deletingBulk) return;
    setShowBulkDeleteModal(false);
  };

  const openSingleDeleteModal = (player: PlayerRow) => {
    setActionError(null);
    setPlayerToDelete(player);
  };

  const closeSingleDeleteModal = () => {
    if (deletingSingle) return;
    setPlayerToDelete(null);
  };

  const confirmSingleDelete = async () => {
    if (!playerToDelete) return;

    try {
      setDeletingSingle(true);
      setActionError(null);

      const res = await fetch(`/api/players/${playerToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to delete player."
        );
      }

      setPlayerToDelete(null);
      setLivePlayers((current) => current.filter((player) => player.id !== playerToDelete.id));
      setSelectedIds((current) => current.filter((id) => id !== playerToDelete.id));
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete player."
      );
    } finally {
      setDeletingSingle(false);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      setDeletingBulk(true);
      setActionError(null);

      const deleteResults = await Promise.all(
        selectedIds.map(async (id) => {
          const res = await fetch(`/api/players/${id}`, {
            method: "DELETE",
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            throw new Error(
              data?.details || data?.error || `Failed to delete player ${id}.`
            );
          }

          return id;
        })
      );

      console.log("Deleted selected players:", deleteResults);

      setShowBulkDeleteModal(false);
      setSelectedIds([]);
      setBulkMode(false);
      setLivePlayers((current) => current.filter((player) => !deleteResults.includes(player.id)));
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete selected players."
      );
    } finally {
      setDeletingBulk(false);
    }
  };

  return (
    <>
      {actionError ? (
        <div className="admin-form-error" style={{ marginBottom: "14px" }}>
          {actionError}
        </div>
      ) : null}

      {actionSuccess ? (
        <p className="login-form-status login-form-status-success" style={{ marginBottom: "14px" }}>
          {actionSuccess}
        </p>
      ) : null}

      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          {bulkMode ? (
            <>
              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-danger"
                onClick={openBulkDeleteModal}
                disabled={selectedIds.length === 0 || deletingBulk}
              >
                <FiTrash2 />
                <span>{deletingBulk ? "Deleting..." : "Delete Selected"}</span>
              </button>

              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-cancel"
                onClick={cancelBulkMode}
                disabled={deletingBulk}
              >
                <FiX />
                <span>Cancel</span>
              </button>

              <span className="admin-selected-count">
                {selectedIds.length} selected
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-import"
              >
                <FiDownload />
                <span>Import</span>
              </button>

              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-export"
              >
                <FiUpload />
                <span>Export</span>
              </button>

              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-bulk"
                onClick={toggleBulkMode}
              >
                <FiCheckSquare />
                <span>Bulk Actions</span>
              </button>

              <Link
                href="/admin/players/new"
                className="admin-toolbar-button admin-toolbar-button-add"
              >
                <FiPlus />
                <span>Add Player</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                {bulkMode && (
                  <th className="admin-checkbox-col">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someVisibleSelected;
                        }
                      }}
                      onChange={toggleSelectAllVisible}
                      aria-label="Select all players"
                    />
                  </th>
                )}
                <th className="admin-players-number-col">#</th>
                <SortableHeader
                  label="Name"
                  columnKey="fullName"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Email"
                  columnKey="email"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Phone Number"
                  columnKey="phoneNumber"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Country"
                  columnKey="country"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Tournaments"
                  columnKey="tournaments"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Invite"
                  columnKey="inviteLabel"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={bulkMode ? 9 : 8}
                    className="admin-players-empty"
                  >
                    No players found.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player, index) => {
                  const isSelected = selectedIds.includes(player.id);
                  const countryCode = normalizeCountryCode(player.country);
                  const canInvite = Boolean(player.email.trim());
                  const inviteDisabledReason = canInvite
                    ? null
                    : "Add an email address before sending an invite.";

                  return (
                    <tr key={player.id}>
                      {bulkMode && (
                        <td className="admin-checkbox-cell">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePlayerSelection(player.id)}
                            aria-label={`Select ${player.fullName}`}
                          />
                        </td>
                      )}

                      <td className="admin-players-number-cell">{index + 1}</td>

                      <td>
                        <div className="admin-player-name-cell">
                          {player.photoUrl ? (
                            <Image
                              src={player.photoUrl}
                              alt={player.fullName}
                              width={36}
                              height={36}
                              className="admin-player-list-thumb"
                            />
                          ) : (
                            <div className="admin-player-list-thumb admin-player-list-thumb-fallback">
                              {getInitials(player.fullName)}
                            </div>
                          )}

                          <Link
                            href={`/admin/players/${player.id}/edit`}
                            className="admin-player-full-name"
                          >
                            {player.fullName}
                          </Link>
                        </div>
                      </td>

                      <td>{player.email || "—"}</td>
                      <td>{player.phoneNumber || "—"}</td>

                      <td className="admin-player-country-cell">
                        {countryCode ? (
                          <Image
                            src={getFlagCdnUrl(countryCode, "w40") ?? ""}
                            alt={player.country || countryCode}
                            width={24}
                            height={18}
                            className="admin-player-country-flag-img"
                            title={player.country || countryCode}
                          />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {player.tournaments.length > 0 ? (
                          <div className="admin-player-tournaments-cell">
                            {player.tournaments.map((tournament) => (
                              <Link
                                key={tournament.id}
                                href={`/admin/tournaments/${tournament.id}/entries`}
                                className="admin-player-tournament-pill"
                              >
                                {tournament.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        <div className="admin-player-invite-cell">
                          <span
                            className={`admin-player-invite-badge ${getInviteBadgeClassName(player.inviteState)}`}
                          >
                            {player.inviteMeta ?? player.inviteLabel}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-player-row-actions">
                          <Link
                            href={`/admin/players/${player.id}/edit`}
                            className="admin-icon-action admin-icon-action-edit"
                            aria-label={`Edit ${player.fullName}`}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Link>

                          <button
                            type="button"
                            className="admin-icon-action admin-icon-action-invite"
                            aria-label={`Send invite to ${player.fullName}`}
                            title={inviteDisabledReason ?? "Send Invite"}
                            onClick={() => void handleSendInvite(player)}
                            disabled={!canInvite || invitingPlayerId === player.id}
                          >
                            <FiMail />
                          </button>

                          <button
                            type="button"
                            className="admin-icon-action admin-icon-action-delete"
                            aria-label={`Delete ${player.fullName}`}
                            title="Delete"
                            onClick={() => openSingleDeleteModal(player)}
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

      {showBulkDeleteModal && (
        <div
          className="admin-modal-backdrop"
          onClick={closeBulkDeleteModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-title"
          >
            <h2 id="bulk-delete-title" className="admin-modal-title">
              Delete selected players?
            </h2>

            <p className="admin-modal-text">
              You are about to delete{" "}
              <strong>
                {selectedIds.length}{" "}
                {selectedIds.length === 1 ? "player" : "players"}
              </strong>
              . This action cannot be undone.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeBulkDeleteModal}
                disabled={deletingBulk}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={confirmBulkDelete}
                disabled={deletingBulk}
              >
                {deletingBulk ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {playerToDelete && (
        <div
          className="admin-modal-backdrop"
          onClick={closeSingleDeleteModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="single-delete-title"
          >
            <h2 id="single-delete-title" className="admin-modal-title">
              Delete player?
            </h2>

            <p className="admin-modal-text">
              You are about to delete{" "}
              <strong>{playerToDelete.fullName}</strong>. This action cannot be
              undone.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeSingleDeleteModal}
                disabled={deletingSingle}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={confirmSingleDelete}
                disabled={deletingSingle}
              >
                {deletingSingle ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getInitials(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function getInviteBadgeClassName(inviteState: AdminPlayerInviteState) {
  switch (inviteState) {
    case "invite-sent":
      return "admin-player-invite-badge-pending";
    case "accepted":
      return "admin-player-invite-badge-accepted";
    case "expired":
      return "admin-player-invite-badge-expired";
    case "revoked":
      return "admin-player-invite-badge-revoked";
    case "not-sent":
    default:
      return "admin-player-invite-badge-idle";
  }
}

function formatAdminDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

