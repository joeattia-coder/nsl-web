"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { notifyAdminAuthChanged } from "@/app/(public)/AdminAuthContext";
import {
  createClientKey,
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
  roleKey: string;
  roleName: string;
};

type GroupAssignmentRecord = {
  roleId: string;
  roleName: string;
  scopeType: string;
  scopeId: string;
  expiresAt: string | null;
};

type GroupRecord = {
  id: string;
  groupName: string;
  description: string | null;
  isActive: boolean;
  memberUserIds: string[];
  memberLabels: string[];
  assignments: GroupAssignmentRecord[];
};

type GroupsManagerProps = {
  groups: GroupRecord[];
  users: UserOption[];
  roles: RoleOption[];
  canManage: boolean;
};

type AssignmentFormRow = {
  key: string;
  roleId: string;
  scopeType: string;
  scopeId: string;
  expiresAt: string;
};

type GroupFormState = {
  id: string | null;
  groupName: string;
  description: string;
  isActive: boolean;
  memberUserIds: string[];
  assignments: AssignmentFormRow[];
};

function emptyFormState(): GroupFormState {
  return {
    id: null,
    groupName: "",
    description: "",
    isActive: true,
    memberUserIds: [],
    assignments: [],
  };
}

function buildFormState(group: GroupRecord): GroupFormState {
  return {
    id: group.id,
    groupName: group.groupName,
    description: group.description ?? "",
    isActive: group.isActive,
    memberUserIds: group.memberUserIds,
    assignments: group.assignments.map((assignment) => ({
      key: createClientKey("group-assignment"),
      roleId: assignment.roleId,
      scopeType: assignment.scopeType,
      scopeId: assignment.scopeId,
      expiresAt: toDateTimeLocalValue(assignment.expiresAt),
    })),
  };
}

export default function GroupsManager({
  groups,
  users,
  roles,
  canManage,
}: GroupsManagerProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<GroupFormState | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const userLabelById = useMemo(
    () => new Map(users.map((user) => [user.id, user.label])),
    [users]
  );
  const filteredUsers = useMemo(() => {
    const normalizedQuery = memberSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => user.label.toLowerCase().includes(normalizedQuery));
  }, [memberSearch, users]);
  const selectedUsers = useMemo(
    () =>
      formState?.memberUserIds
        .map((userId) => ({
          id: userId,
          label: userLabelById.get(userId) ?? "Unknown user",
        }))
        .sort((left, right) => left.label.localeCompare(right.label)) ?? [],
    [formState?.memberUserIds, userLabelById]
  );

  const startCreate = () => {
    setError(null);
    setMemberSearch("");
    setFormState(emptyFormState());
  };

  const startEdit = (group: GroupRecord) => {
    setError(null);
    setMemberSearch("");
    setFormState(buildFormState(group));
  };

  const cancelEdit = () => {
    if (isSaving) {
      return;
    }

    setFormState(null);
    setMemberSearch("");
    setError(null);
  };

  const toggleMember = (userId: string) => {
    if (!formState) {
      return;
    }

    setFormState({
      ...formState,
      memberUserIds: formState.memberUserIds.includes(userId)
        ? formState.memberUserIds.filter((value) => value !== userId)
        : [...formState.memberUserIds, userId],
    });
  };

  const updateVisibleMembers = (selectedUserIds: string[]) => {
    if (!formState) {
      return;
    }

    const visibleUserIds = new Set(filteredUsers.map((user) => user.id));
    const preservedHiddenSelections = formState.memberUserIds.filter(
      (userId) => !visibleUserIds.has(userId)
    );

    setFormState({
      ...formState,
      memberUserIds: [...preservedHiddenSelections, ...selectedUserIds],
    });
  };

  const addAssignment = () => {
    if (!formState) {
      return;
    }

    setFormState({
      ...formState,
      assignments: [
        ...formState.assignments,
        {
          key: createClientKey("group-assignment"),
          roleId: roles[0]?.id ?? "",
          scopeType: "GLOBAL",
          scopeId: "",
          expiresAt: "",
        },
      ],
    });
  };

  const updateAssignment = (
    assignmentKey: string,
    patch: Partial<AssignmentFormRow>
  ) => {
    if (!formState) {
      return;
    }

    setFormState({
      ...formState,
      assignments: formState.assignments.map((assignment) =>
        assignment.key === assignmentKey
          ? { ...assignment, ...patch }
          : assignment
      ),
    });
  };

  const removeAssignment = (assignmentKey: string) => {
    if (!formState) {
      return;
    }

    setFormState({
      ...formState,
      assignments: formState.assignments.filter(
        (assignment) => assignment.key !== assignmentKey
      ),
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
          ? `/api/admin/security/groups/${formState.id}`
          : "/api/admin/security/groups",
        {
          method: formState.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupName: formState.groupName,
            description: formState.description,
            isActive: formState.isActive,
            membershipUserIds: formState.memberUserIds,
            roleAssignments: formState.assignments.map((assignment) => ({
              roleId: assignment.roleId,
              scopeType: assignment.scopeType,
              scopeId: assignment.scopeType === "GLOBAL" ? "" : assignment.scopeId,
              expiresAt: assignment.expiresAt || null,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to save group."));
      }

      setFormState(null);
      notifyAdminAuthChanged();
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error ? submitError.message : "Failed to save group."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteGroup = async (group: GroupRecord) => {
    if (!window.confirm(`Delete ${group.groupName}?`)) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/admin/security/groups/${group.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to delete group."));
      }

      if (formState?.id === group.id) {
        setFormState(null);
      }

      notifyAdminAuthChanged();
      router.refresh();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete group."
      );
    }
  };

  return (
    <section className="admin-security-panel admin-table-card">
      <div className="admin-security-panel-header">
        <div>
          <p className="admin-security-kicker">Groups</p>
          <h2>Access Groups</h2>
          <p>
            Create reusable access cohorts, manage memberships, and attach
            inherited role grants from one place.
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
              <span>Add Group</span>
            </button>
          ) : null}
        </div>
      </div>

      {canManage && formState ? (
        <div className="admin-card admin-security-card admin-security-form-card">
          <form onSubmit={submitForm} className="admin-form">
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-label" htmlFor="security-group-name">
                  Group Name
                </label>
                <input
                  id="security-group-name"
                  type="text"
                  className="admin-input admin-player-form-input"
                  value={formState.groupName}
                  onChange={(event) =>
                    setFormState({ ...formState, groupName: event.target.value })
                  }
                  required
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-label admin-security-checkbox">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(event) =>
                      setFormState({ ...formState, isActive: event.target.checked })
                    }
                  />
                  <span>Group is active</span>
                </label>
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label" htmlFor="security-group-description">
                  Description
                </label>
                <textarea
                  id="security-group-description"
                  className="admin-input admin-player-form-input"
                  rows={3}
                  value={formState.description}
                  onChange={(event) =>
                    setFormState({ ...formState, description: event.target.value })
                  }
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label">Members</label>
                <div className="admin-security-picker">
                  <div className="admin-security-picker-toolbar">
                    <input
                      type="search"
                      className="admin-search-input admin-security-picker-search"
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                      placeholder="Search users by name, username, or email"
                    />
                    <p className="admin-security-muted">
                      {selectedUsers.length} selected · {filteredUsers.length} shown
                    </p>
                  </div>

                  {selectedUsers.length > 0 ? (
                    <div className="admin-security-badge-group admin-security-picker-selected">
                      {selectedUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="admin-security-picker-chip"
                          onClick={() => toggleMember(user.id)}
                        >
                          <span>{user.label}</span>
                          <FiX />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-security-muted">No members selected yet.</p>
                  )}

                  {filteredUsers.length === 0 ? (
                    <p className="admin-security-muted admin-security-picker-empty">
                      No users match that search.
                    </p>
                  ) : (
                    <select
                      multiple
                      size={Math.min(Math.max(filteredUsers.length, 6), 12)}
                      className="admin-input admin-player-form-input admin-security-multiselect"
                      value={filteredUsers
                        .filter((user) => formState.memberUserIds.includes(user.id))
                        .map((user) => user.id)}
                      onChange={(event) =>
                        updateVisibleMembers(
                          Array.from(event.currentTarget.selectedOptions, (option) => option.value)
                        )
                      }
                    >
                      {filteredUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="admin-form-field admin-form-field-full">
                <div className="admin-security-section-heading-row">
                  <label className="admin-label">Group Role Grants</label>
                  <button
                    type="button"
                    className="admin-toolbar-button admin-toolbar-button-add"
                    onClick={addAssignment}
                  >
                    <FiPlus />
                    <span>Add Grant</span>
                  </button>
                </div>

                <div className="admin-security-repeater">
                  {formState.assignments.length === 0 ? (
                    <p className="admin-security-muted">No inherited grants configured.</p>
                  ) : (
                    formState.assignments.map((assignment) => (
                      <div key={assignment.key} className="admin-security-repeater-row">
                        <div className="admin-form-field">
                          <label className="admin-label">Role</label>
                          <select
                            className="admin-input admin-player-form-input"
                            value={assignment.roleId}
                            onChange={(event) =>
                              updateAssignment(assignment.key, { roleId: event.target.value })
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
                            value={assignment.scopeType}
                            onChange={(event) =>
                              updateAssignment(assignment.key, {
                                scopeType: event.target.value,
                                scopeId: event.target.value === "GLOBAL" ? "" : assignment.scopeId,
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
                            value={assignment.scopeId}
                            disabled={assignment.scopeType === "GLOBAL"}
                            onChange={(event) =>
                              updateAssignment(assignment.key, { scopeId: event.target.value })
                            }
                          />
                        </div>

                        <div className="admin-form-field">
                          <label className="admin-label">Expires At</label>
                          <input
                            type="datetime-local"
                            className="admin-input admin-player-form-input"
                            value={assignment.expiresAt}
                            onChange={(event) =>
                              updateAssignment(assignment.key, { expiresAt: event.target.value })
                            }
                          />
                        </div>

                        <div className="admin-form-field admin-security-repeater-action">
                          <button
                            type="button"
                            className="admin-security-action-link admin-security-action-link-danger"
                            onClick={() => removeAssignment(assignment.key)}
                          >
                            <FiTrash2 />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
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
                <span>{isSaving ? "Saving..." : formState.id ? "Save Group" : "Create Group"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Group</th>
              <th>Status</th>
              <th>Members</th>
              <th>Grants</th>
              {canManage ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="admin-security-empty-cell">
                  No access groups found.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id}>
                  <td>
                    <div className="admin-security-cell-stack">
                      <strong>{group.groupName}</strong>
                      <span className="admin-security-muted">
                        {group.description ?? "No description"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`admin-security-badge ${
                        group.isActive
                          ? "admin-security-badge-positive"
                          : "admin-security-badge-warning"
                      }`}
                    >
                      {group.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-security-compact-list">
                      <span>{group.memberUserIds.length} members</span>
                      {(group.memberLabels.length > 0
                        ? group.memberLabels
                        : group.memberUserIds.map((userId) => userLabelById.get(userId) ?? userId)
                      ).map((label) => (
                        <span key={`${group.id}-${label}`} className="admin-security-muted">
                          {label}
                        </span>
                      ))}
                      {group.memberUserIds.length === 0 ? (
                        <span className="admin-security-muted">No members</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="admin-security-badge-group">
                      {group.assignments.length === 0 ? (
                        <span className="admin-security-badge admin-security-badge-muted">
                          No grants
                        </span>
                      ) : (
                        group.assignments.map((assignment, index) => (
                          <span key={`${group.id}-${assignment.roleId}-${index}`} className="admin-security-badge admin-security-badge-muted">
                            {assignment.roleName}
                            {assignment.scopeType === "GLOBAL"
                              ? ""
                              : ` (${assignment.scopeType}: ${assignment.scopeId})`}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  {canManage ? (
                    <td>
                      <div className="admin-security-row-actions">
                        <button
                          type="button"
                          className="admin-security-action-link"
                          onClick={() => startEdit(group)}
                        >
                          <FiEdit2 />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="admin-security-action-link admin-security-action-link-danger"
                          onClick={() => deleteGroup(group)}
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