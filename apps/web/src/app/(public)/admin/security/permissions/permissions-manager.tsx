"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { notifyAdminAuthChanged } from "@/app/(public)/AdminAuthContext";
import { getApiErrorMessage } from "../security-client-utils";

type PermissionRecord = {
  id: string;
  permissionKey: string;
  permissionName: string;
  category: string;
  description: string | null;
  roleLinkCount: number;
  overrideCount: number;
};

type PermissionsManagerProps = {
  permissions: PermissionRecord[];
  canManage: boolean;
};

type PermissionFormState = {
  id: string | null;
  permissionKey: string;
  permissionName: string;
  category: string;
  description: string;
};

function emptyPermissionFormState(): PermissionFormState {
  return {
    id: null,
    permissionKey: "",
    permissionName: "",
    category: "System",
    description: "",
  };
}

function buildPermissionFormState(permission: PermissionRecord): PermissionFormState {
  return {
    id: permission.id,
    permissionKey: permission.permissionKey,
    permissionName: permission.permissionName,
    category: permission.category,
    description: permission.description ?? "",
  };
}

export default function PermissionsManager({ permissions, canManage }: PermissionsManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<PermissionFormState | null>(null);
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

      const response = await fetch(
        formState.id
          ? `/api/admin/security/permissions/${formState.id}`
          : "/api/admin/security/permissions",
        {
          method: formState.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissionKey: formState.permissionKey,
            permissionName: formState.permissionName,
            category: formState.category,
            description: formState.description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to save permission."));
      }

      setFormState(null);
      notifyAdminAuthChanged();
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save permission."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deletePermission = async (permission: PermissionRecord) => {
    if (!window.confirm(`Delete ${permission.permissionName}?`)) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/admin/security/permissions/${permission.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete permission."));
      }

      if (formState?.id === permission.id) {
        setFormState(null);
      }

      notifyAdminAuthChanged();
      router.refresh();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete permission."
      );
    }
  };

  return (
    <section className="admin-security-panel admin-table-card">
      <div className="admin-security-panel-header">
        <div>
          <p className="admin-security-kicker">Permissions</p>
          <h2>Permission Catalog</h2>
          <p>
            Manage permission definitions, keep categories tidy, and see where
            each permission is already linked into roles or overrides.
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
                setFormState(emptyPermissionFormState());
              }}
            >
              <FiPlus />
              <span>Add Permission</span>
            </button>
          ) : null}
        </div>
      </div>

      {canManage && formState ? (
        <div className="admin-card admin-security-card admin-security-form-card">
          <form onSubmit={submitForm} className="admin-form">
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-label" htmlFor="security-permission-key">
                  Permission Key
                </label>
                <input
                  id="security-permission-key"
                  type="text"
                  className="admin-input admin-player-form-input"
                  value={formState.permissionKey}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      permissionKey: event.target.value.toLowerCase(),
                    })
                  }
                  required
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-label" htmlFor="security-permission-name">
                  Permission Name
                </label>
                <input
                  id="security-permission-name"
                  type="text"
                  className="admin-input admin-player-form-input"
                  value={formState.permissionName}
                  onChange={(event) =>
                    setFormState({ ...formState, permissionName: event.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-label" htmlFor="security-permission-category">
                  Category
                </label>
                <input
                  id="security-permission-category"
                  type="text"
                  className="admin-input admin-player-form-input"
                  value={formState.category}
                  onChange={(event) =>
                    setFormState({ ...formState, category: event.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label" htmlFor="security-permission-description">
                  Description
                </label>
                <textarea
                  id="security-permission-description"
                  rows={3}
                  className="admin-input admin-player-form-input"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState({ ...formState, description: event.target.value })
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
                disabled={isSaving}
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
                <span>
                  {isSaving
                    ? "Saving..."
                    : formState.id
                      ? "Save Permission"
                      : "Create Permission"}
                </span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Category</th>
              <th>Description</th>
              <th>Role Links</th>
              <th>Overrides</th>
              {canManage ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {permissions.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="admin-security-empty-cell">
                  No permissions found.
                </td>
              </tr>
            ) : (
              permissions.map((permission) => (
                <tr key={permission.id}>
                  <td>
                    <div className="admin-security-cell-stack">
                      <strong>{permission.permissionName}</strong>
                      <span className="admin-security-muted">
                        {permission.permissionKey}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-security-badge admin-security-badge-muted">
                      {permission.category}
                    </span>
                  </td>
                  <td>{permission.description ?? "No description"}</td>
                  <td>{permission.roleLinkCount}</td>
                  <td>{permission.overrideCount}</td>
                  {canManage ? (
                    <td>
                      <div className="admin-security-row-actions">
                        <button
                          type="button"
                          className="admin-security-action-link"
                          onClick={() => {
                            setError(null);
                            setFormState(buildPermissionFormState(permission));
                          }}
                        >
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="admin-security-action-link admin-security-action-link-danger"
                          onClick={() => deletePermission(permission)}
                        >
                          <FiTrash2 />
                          <span>Delete</span>
                        </button>
                      </div>
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