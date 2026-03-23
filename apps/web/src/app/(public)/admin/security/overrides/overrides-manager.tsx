"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { notifyAdminAuthChanged } from "@/app/(public)/AdminAuthContext";
import {
  getApiErrorMessage,
  SECURITY_SCOPE_OPTIONS,
} from "../security-client-utils";

type UserOption = {
  id: string;
  label: string;
};

type PermissionOption = {
  id: string;
  permissionName: string;
  permissionKey: string;
};

type OverrideRecord = {
  id: string;
  userLabel: string;
  permissionName: string;
  permissionKey: string;
  effect: string;
  scopeLabel: string;
  grantedByLabel: string;
  reason: string;
  expiresAtLabel: string;
};

type OverridesManagerProps = {
  overrides: OverrideRecord[];
  users: UserOption[];
  permissions: PermissionOption[];
  canManage: boolean;
};

type OverrideFormState = {
  userId: string;
  permissionId: string;
  effect: "ALLOW" | "DENY";
  scopeType: string;
  scopeId: string;
  reason: string;
  expiresAt: string;
};

function emptyOverrideFormState(
  users: UserOption[],
  permissions: PermissionOption[]
): OverrideFormState {
  return {
    userId: users[0]?.id ?? "",
    permissionId: permissions[0]?.id ?? "",
    effect: "ALLOW",
    scopeType: "GLOBAL",
    scopeId: "",
    reason: "",
    expiresAt: "",
  };
}

export default function OverridesManager({
  overrides,
  users,
  permissions,
  canManage,
}: OverridesManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<OverrideFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/admin/security/overrides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formState.userId,
          permissionId: formState.permissionId,
          effect: formState.effect,
          scopeType: formState.scopeType,
          scopeId: formState.scopeType === "GLOBAL" ? "" : formState.scopeId,
          reason: formState.reason,
          expiresAt: formState.expiresAt || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create override."));
      }

      setFormState(null);
      notifyAdminAuthChanged();
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to create override.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOverride = async (overrideId: string) => {
    if (!window.confirm("Delete this permission override?")) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/admin/security/overrides/${overrideId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete override."));
      }

      notifyAdminAuthChanged();
      router.refresh();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete override.");
    }
  };

  return (
    <section className="admin-security-panel admin-table-card">
      <div className="admin-security-panel-header">
        <div>
          <p className="admin-security-kicker">Overrides</p>
          <h2>User Permission Overrides</h2>
          <p>
            Keep exceptions explicit and rare by managing them in one visible
            place with clear scope and expiry.
          </p>
        </div>
      </div>

      <div className="admin-players-toolbar admin-security-panel-toolbar">
        <div className="admin-players-toolbar-left">
          {error ? <p className="admin-form-error">{error}</p> : null}
        </div>
        <div className="admin-players-toolbar-right">
          {canManage ? (
            <button
              type="button"
              className="admin-toolbar-button admin-toolbar-button-add"
              onClick={() => {
                setError(null);
                setFormState(emptyOverrideFormState(users, permissions));
              }}
            >
              <FiPlus />
              <span>Add Override</span>
            </button>
          ) : null}
        </div>
      </div>

      {canManage && formState ? (
        <div className="admin-card admin-security-card admin-security-form-card">
          <form onSubmit={submitForm} className="admin-form">
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-label">User</label>
                <select
                  className="admin-input admin-player-form-input"
                  value={formState.userId}
                  onChange={(event) =>
                    setFormState({ ...formState, userId: event.target.value })
                  }
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Permission</label>
                <select
                  className="admin-input admin-player-form-input"
                  value={formState.permissionId}
                  onChange={(event) =>
                    setFormState({ ...formState, permissionId: event.target.value })
                  }
                >
                  {permissions.map((permission) => (
                    <option key={permission.id} value={permission.id}>
                      {permission.permissionName} ({permission.permissionKey})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Effect</label>
                <select
                  className="admin-input admin-player-form-input"
                  value={formState.effect}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      effect: event.target.value as "ALLOW" | "DENY",
                    })
                  }
                >
                  <option value="ALLOW">Allow</option>
                  <option value="DENY">Deny</option>
                </select>
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Scope</label>
                <select
                  className="admin-input admin-player-form-input"
                  value={formState.scopeType}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      scopeType: event.target.value,
                      scopeId: event.target.value === "GLOBAL" ? "" : formState.scopeId,
                    })
                  }
                >
                  {SECURITY_SCOPE_OPTIONS.map((scope) => (
                    <option key={scope.value} value={scope.value}>
                      {scope.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Scope Id</label>
                <input
                  type="text"
                  className="admin-input admin-player-form-input"
                  value={formState.scopeId}
                  disabled={formState.scopeType === "GLOBAL"}
                  onChange={(event) =>
                    setFormState({ ...formState, scopeId: event.target.value })
                  }
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Expires At</label>
                <input
                  type="datetime-local"
                  className="admin-input admin-player-form-input"
                  value={formState.expiresAt}
                  onChange={(event) =>
                    setFormState({ ...formState, expiresAt: event.target.value })
                  }
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label">Reason</label>
                <textarea
                  rows={3}
                  className="admin-input admin-player-form-input"
                  value={formState.reason}
                  onChange={(event) =>
                    setFormState({ ...formState, reason: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="admin-security-form-actions">
              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-cancel"
                onClick={() => {
                  if (!isSaving) {
                    setFormState(null);
                    setError(null);
                  }
                }}
              >
                <FiX />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="admin-toolbar-button admin-toolbar-button-add"
                disabled={isSaving}
              >
                <FiPlus />
                <span>{isSaving ? "Saving..." : "Create Override"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Permission</th>
              <th>Effect</th>
              <th>Scope</th>
              <th>Granted By</th>
              <th>Reason</th>
              <th>Expires</th>
              {canManage ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {overrides.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="admin-security-empty-cell">
                  No user overrides found.
                </td>
              </tr>
            ) : (
              overrides.map((override) => (
                <tr key={override.id}>
                  <td>{override.userLabel}</td>
                  <td>
                    <div className="admin-security-cell-stack">
                      <strong>{override.permissionName}</strong>
                      <span className="admin-security-muted">
                        {override.permissionKey}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`admin-security-badge ${
                        override.effect === "ALLOW"
                          ? "admin-security-badge-positive"
                          : "admin-security-badge-warning"
                      }`}
                    >
                      {override.effect}
                    </span>
                  </td>
                  <td>{override.scopeLabel}</td>
                  <td>{override.grantedByLabel}</td>
                  <td>{override.reason}</td>
                  <td>{override.expiresAtLabel}</td>
                  {canManage ? (
                    <td>
                      <button
                        type="button"
                        className="admin-security-action-link admin-security-action-link-danger"
                        onClick={() => deleteOverride(override.id)}
                      >
                        <FiTrash2 />
                        <span>Delete</span>
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}