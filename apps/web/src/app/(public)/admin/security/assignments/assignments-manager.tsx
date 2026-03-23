"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { notifyAdminAuthChanged } from "@/app/(public)/AdminAuthContext";
import {
  getApiErrorMessage,
  SECURITY_SCOPE_OPTIONS,
  toDateTimeLocalValue,
} from "../security-client-utils";

type UserOption = {
  id: string;
  label: string;
};

type RoleOption = {
  id: string;
  roleName: string;
};

type UserAssignmentRecord = {
  id: string;
  userLabel: string;
  roleName: string;
  scopeLabel: string;
  grantedByLabel: string;
  createdAtLabel: string;
  expiresAtLabel: string;
};

type GroupAssignmentRecord = {
  id: string;
  groupLabel: string;
  roleName: string;
  scopeLabel: string;
  grantedByLabel: string;
  createdAtLabel: string;
  expiresAtLabel: string;
};

type AssignmentsManagerProps = {
  userAssignments: UserAssignmentRecord[];
  groupAssignments: GroupAssignmentRecord[];
  users: UserOption[];
  roles: RoleOption[];
  canManage: boolean;
};

type AssignmentFormState = {
  userId: string;
  roleId: string;
  scopeType: string;
  scopeId: string;
  expiresAt: string;
};

function emptyAssignmentFormState(users: UserOption[], roles: RoleOption[]): AssignmentFormState {
  return {
    userId: users[0]?.id ?? "",
    roleId: roles[0]?.id ?? "",
    scopeType: "GLOBAL",
    scopeId: "",
    expiresAt: "",
  };
}

export default function AssignmentsManager({
  userAssignments,
  groupAssignments,
  users,
  roles,
  canManage,
}: AssignmentsManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<AssignmentFormState | null>(null);
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

      const response = await fetch("/api/admin/security/user-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formState.userId,
          roleId: formState.roleId,
          scopeType: formState.scopeType,
          scopeId: formState.scopeType === "GLOBAL" ? "" : formState.scopeId,
          expiresAt: formState.expiresAt || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create assignment."));
      }

      setFormState(null);
      notifyAdminAuthChanged();
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create assignment."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!window.confirm("Delete this direct role assignment?")) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/admin/security/user-assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete assignment."));
      }

      notifyAdminAuthChanged();
      router.refresh();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete assignment."
      );
    }
  };

  return (
    <>
      <section className="admin-security-panel admin-table-card">
        <div className="admin-security-panel-header">
          <div>
            <p className="admin-security-kicker">Assignments</p>
            <h2>User Role Assignments</h2>
            <p>
              Manage direct grants here. Group-based inherited grants remain
              visible below and are edited from the Groups tab.
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
                  setFormState(emptyAssignmentFormState(users, roles));
                }}
              >
                <FiPlus />
                <span>Add User Assignment</span>
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
                  <label className="admin-label">Role</label>
                  <select
                    className="admin-input admin-player-form-input"
                    value={formState.roleId}
                    onChange={(event) =>
                      setFormState({ ...formState, roleId: event.target.value })
                    }
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
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
                  <span>{isSaving ? "Saving..." : "Create Assignment"}</span>
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
                <th>Role</th>
                <th>Scope</th>
                <th>Granted By</th>
                <th>Created</th>
                <th>Expires</th>
                {canManage ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {userAssignments.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="admin-security-empty-cell">
                    No direct user assignments found.
                  </td>
                </tr>
              ) : (
                userAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.userLabel}</td>
                    <td>{assignment.roleName}</td>
                    <td>{assignment.scopeLabel}</td>
                    <td>{assignment.grantedByLabel}</td>
                    <td>{assignment.createdAtLabel}</td>
                    <td>{assignment.expiresAtLabel}</td>
                    {canManage ? (
                      <td>
                        <button
                          type="button"
                          className="admin-security-action-link admin-security-action-link-danger"
                          onClick={() => deleteAssignment(assignment.id)}
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

      <section className="admin-security-panel admin-table-card">
        <div className="admin-security-panel-header">
          <div>
            <p className="admin-security-kicker">Assignments</p>
            <h2>Group Role Assignments</h2>
            <p>
              These inherited grants are shown here for review and are managed
              through the Groups tab.
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Role</th>
                <th>Scope</th>
                <th>Granted By</th>
                <th>Created</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {groupAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-security-empty-cell">
                    No group role assignments found.
                  </td>
                </tr>
              ) : (
                groupAssignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.groupLabel}</td>
                    <td>{assignment.roleName}</td>
                    <td>{assignment.scopeLabel}</td>
                    <td>{assignment.grantedByLabel}</td>
                    <td>{assignment.createdAtLabel}</td>
                    <td>{assignment.expiresAtLabel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}