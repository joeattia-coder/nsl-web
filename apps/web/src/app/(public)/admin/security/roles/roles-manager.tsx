"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { notifyAdminAuthChanged } from "@/app/(public)/AdminAuthContext";
import {
  getApiErrorMessage,
  groupOptionsByCategory,
} from "../security-client-utils";

type PermissionOption = {
  id: string;
  permissionKey: string;
  permissionName: string;
  category: string;
};

type RoleRecord = {
  id: string;
  roleKey: string;
  roleName: string;
  description: string | null;
  isSystemRole: boolean;
  permissionIds: string[];
  usageSummary: string[];
};

type RolesManagerProps = {
  roles: RoleRecord[];
  permissions: PermissionOption[];
  canManage: boolean;
};

type RoleFormState = {
  id: string | null;
  roleKey: string;
  roleName: string;
  description: string;
  isSystemRole: boolean;
  permissionIds: string[];
};

const LOCKED_SYSTEM_ROLE_KEY = "ADMINISTRATOR";

function isLockedSystemRole(role: Pick<RoleRecord, "roleKey" | "isSystemRole">) {
  return role.isSystemRole && role.roleKey === LOCKED_SYSTEM_ROLE_KEY;
}

function emptyRoleFormState(): RoleFormState {
  return {
    id: null,
    roleKey: "",
    roleName: "",
    description: "",
    isSystemRole: false,
    permissionIds: [],
  };
}

function buildRoleFormState(role: RoleRecord): RoleFormState {
  return {
    id: role.id,
    roleKey: role.roleKey,
    roleName: role.roleName,
    description: role.description ?? "",
    isSystemRole: role.isSystemRole,
    permissionIds: role.permissionIds,
  };
}

export default function RolesManager({ roles, permissions, canManage }: RolesManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<RoleFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const permissionsByCategory = useMemo(
    () => groupOptionsByCategory(permissions),
    [permissions]
  );

  const startCreate = () => {
    setError(null);
    setFormState(emptyRoleFormState());
  };

  const startEdit = (role: RoleRecord) => {
    setError(null);
    setFormState(buildRoleFormState(role));
  };

  const cancelEdit = () => {
    if (isSaving) {
      return;
    }

    setFormState(null);
    setError(null);
  };

  const togglePermission = (permissionId: string) => {
    if (!formState) {
      return;
    }

    setFormState({
      ...formState,
      permissionIds: formState.permissionIds.includes(permissionId)
        ? formState.permissionIds.filter((value) => value !== permissionId)
        : [...formState.permissionIds, permissionId],
    });
  };

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
          ? `/api/admin/security/roles/${formState.id}`
          : "/api/admin/security/roles",
        {
          method: formState.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roleKey: formState.roleKey,
            roleName: formState.roleName,
            description: formState.description,
            permissionIds: formState.permissionIds,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to save role."));
      }

      setFormState(null);
      notifyAdminAuthChanged();
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(submitError instanceof Error ? submitError.message : "Failed to save role.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRole = async (role: RoleRecord) => {
    if (!window.confirm(`Delete ${role.roleName}?`)) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/admin/security/roles/${role.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete role."));
      }

      if (formState?.id === role.id) {
        setFormState(null);
      }

      notifyAdminAuthChanged();
      router.refresh();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete role.");
    }
  };

  return (
    <section className="admin-security-panel admin-table-card">
      <div className="admin-security-panel-header">
        <div>
          <p className="admin-security-kicker">Roles</p>
          <h2>Role Bundles</h2>
          <p>
            Create custom roles, refine permission bundles, and keep system role
            definitions visible without leaving the security section.
          </p>
          <p className="admin-security-muted">
            The Administrator role is locked as a system role and cannot be edited.
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
              onClick={startCreate}
            >
              <FiPlus />
              <span>Add Role</span>
            </button>
          ) : null}
        </div>
      </div>

      {canManage && formState ? (
        <div className="admin-card admin-security-card admin-security-form-card">
          <form onSubmit={submitForm} className="admin-form">
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-label" htmlFor="security-role-key">
                  Role Key
                </label>
                <input
                  id="security-role-key"
                  type="text"
                  className="admin-input admin-player-form-input"
                  value={formState.roleKey}
                  disabled={formState.isSystemRole}
                  onChange={(event) =>
                    setFormState({ ...formState, roleKey: event.target.value.toUpperCase() })
                  }
                  required
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-label" htmlFor="security-role-name">
                  Role Name
                </label>
                <input
                  id="security-role-name"
                  type="text"
                  className="admin-input admin-player-form-input"
                  value={formState.roleName}
                  disabled={formState.isSystemRole}
                  onChange={(event) =>
                    setFormState({ ...formState, roleName: event.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label" htmlFor="security-role-description">
                  Description
                </label>
                <textarea
                  id="security-role-description"
                  rows={3}
                  className="admin-input admin-player-form-input"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState({ ...formState, description: event.target.value })
                  }
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label">Permissions</label>
                <div className="admin-security-category-stack">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <section key={category} className="admin-security-category-card">
                      <h3>{category}</h3>
                      <div className="admin-security-checklist-grid">
                        {categoryPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="admin-security-checkbox admin-security-checklist-item"
                          >
                            <input
                              type="checkbox"
                              checked={formState.permissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            <span>
                              {permission.permissionName}
                              <span className="admin-security-muted"> ({permission.permissionKey})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-security-form-actions">
              <button
                type="button"
                className="admin-toolbar-button admin-toolbar-button-cancel"
                onClick={cancelEdit}
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
                <span>{isSaving ? "Saving..." : formState.id ? "Save Role" : "Create Role"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Type</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Usage</th>
              {canManage ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="admin-security-empty-cell">
                  No roles found.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div className="admin-security-cell-stack">
                      <strong>{role.roleName}</strong>
                      <span className="admin-security-muted">{role.roleKey}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`admin-security-badge ${
                        role.isSystemRole
                          ? "admin-security-badge-positive"
                          : "admin-security-badge-muted"
                      }`}
                    >
                      {role.isSystemRole ? "System" : "Custom"}
                    </span>
                  </td>
                  <td>{role.description ?? "No description"}</td>
                  <td>{role.permissionIds.length}</td>
                  <td>
                    <div className="admin-security-cell-stack">
                      {role.usageSummary.map((usage) => (
                        <span key={`${role.id}-${usage}`}>{usage}</span>
                      ))}
                    </div>
                  </td>
                  {canManage ? (
                    <td>
                      <div className="admin-security-row-actions">
                        {isLockedSystemRole(role) ? (
                          <span className="admin-security-muted">Locked system role</span>
                        ) : (
                          <button
                            type="button"
                            className="admin-security-action-link"
                            onClick={() => startEdit(role)}
                          >
                            <FiEdit2 />
                            <span>Edit</span>
                          </button>
                        )}
                        {!role.isSystemRole ? (
                          <button
                            type="button"
                            className="admin-security-action-link admin-security-action-link-danger"
                            onClick={() => deleteRole(role)}
                          >
                            <FiTrash2 />
                            <span>Delete</span>
                          </button>
                        ) : null}
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