"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { notifyAdminAuthChanged } from "@/app/(public)/AdminAuthContext";
import {
  SortableHeader,
  type SortDirection,
  sortRows,
} from "@/lib/admin-table-sorting";

type SecurityUserRow = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  registrationStatus: string;
  isLoginEnabled: boolean;
  emailVerifiedLabel: string;
  emailVerified: boolean;
  providersLabel: string;
  assignedAccessLabel: string;
  invitesCount: number;
  overridesCount: number;
  createdAtLabel: string;
  isGlobalAdmin: boolean;
};

type UsersTableProps = {
  users: SecurityUserRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  currentUserId: string;
};

type SortKey = "displayName" | "email" | "registrationStatus" | "createdAtLabel";

export default function UsersTable({
  users,
  canCreate,
  canEdit,
  canDelete,
  currentUserId,
}: UsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("displayName");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [userToDelete, setUserToDelete] = useState<SecurityUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = !term
      ? users
      : users.filter((user) => {
          return (
            user.displayName.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.assignedAccessLabel.toLowerCase().includes(term)
          );
        });

    return sortRows(
      rows,
      (user) => {
        switch (sortKey) {
          case "email":
            return user.email;
          case "registrationStatus":
            return user.registrationStatus;
          case "createdAtLabel":
            return user.createdAtLabel;
          case "displayName":
          default:
            return user.displayName;
        }
      },
      sortDirection
    );
  }, [search, sortDirection, sortKey, users]);

  const handleSort = (columnKey: SortKey) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  };

  const confirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      setDeleting(true);
      setActionError(null);

      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.details || payload?.error || "Failed to delete user.");
      }

      setUserToDelete(null);
      notifyAdminAuthChanged();
      router.refresh();
    } catch (error) {
      console.error(error);
      setActionError(error instanceof Error ? error.message : "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {actionError ? <p className="admin-form-error">{actionError}</p> : null}

      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search users..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          {canCreate ? (
            <Link
              href="/admin/security/users/new"
              className="admin-toolbar-button admin-toolbar-button-add"
            >
              <FiPlus />
              <span>Add User</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <SortableHeader
                label="User"
                columnKey="displayName"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Contact"
                columnKey="email"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="State"
                columnKey="registrationStatus"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <th>Providers</th>
              <th>Assigned Access</th>
              <th>Signals</th>
              <SortableHeader
                label="Created"
                columnKey="createdAtLabel"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              {canEdit || canDelete ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={canEdit || canDelete ? 8 : 7} className="admin-security-empty-cell">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-security-cell-stack">
                        {canEdit ? (
                          <Link href={`/admin/security/users/${user.id}`}>
                            <strong>{user.displayName}</strong>
                          </Link>
                        ) : (
                          <strong>{user.displayName}</strong>
                        )}
                        <span className="admin-security-muted">{user.username}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-security-cell-stack">
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-security-badge-group">
                        <span className="admin-security-badge">{user.registrationStatus}</span>
                        <span
                          className={`admin-security-badge ${
                            user.isLoginEnabled
                              ? "admin-security-badge-positive"
                              : "admin-security-badge-muted"
                          }`}
                        >
                          {user.isLoginEnabled ? "Login enabled" : "Login disabled"}
                        </span>
                        <span
                          className={`admin-security-badge ${
                            user.emailVerified
                              ? "admin-security-badge-positive"
                              : "admin-security-badge-warning"
                          }`}
                        >
                          {user.emailVerifiedLabel}
                        </span>
                        {user.isGlobalAdmin ? (
                          <span className="admin-security-badge admin-security-badge-global">
                            Global admin
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{user.providersLabel}</td>
                    <td>{user.assignedAccessLabel}</td>
                    <td>
                      <div className="admin-security-cell-stack">
                        <span>{user.invitesCount} invites</span>
                        <span>{user.overridesCount} overrides</span>
                      </div>
                    </td>
                    <td>{user.createdAtLabel}</td>
                    {canEdit || canDelete ? (
                      <td>
                        <div className="admin-security-row-actions">
                          {canEdit ? (
                            <Link
                              href={`/admin/security/users/${user.id}`}
                              className="admin-security-action-link"
                            >
                              <FiEdit2 />
                              <span>Edit</span>
                            </Link>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              className="admin-security-action-link admin-security-action-link-danger"
                              onClick={() => {
                                setActionError(null);
                                setUserToDelete(user);
                              }}
                              disabled={isCurrentUser}
                            >
                              <FiTrash2 />
                              <span>{isCurrentUser ? "Current user" : "Delete"}</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {userToDelete ? (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
            <h2 id="delete-user-title" className="admin-modal-title">
              Delete user
            </h2>
            <p className="admin-modal-text">
              Delete {userToDelete.displayName}? This removes the account and unlinks any player profile. Users with recorded match activity or created invitations cannot be deleted.
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => {
                  if (!deleting) {
                    setUserToDelete(null);
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}