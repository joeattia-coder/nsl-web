"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiMail, FiSave, FiUserPlus } from "react-icons/fi";
import { notifyAdminAuthChanged } from "@/app/(public)/AdminAuthContext";
import PasswordField from "@/components/admin/PasswordField";
import { formatDateInAdminTimeZone, formatDateTimeInAdminTimeZone } from "@/lib/timezone";

type UserFormMode = "create" | "edit";

type UserFormProps = {
  mode: UserFormMode;
  userId?: string;
  canAssignGlobalAdmin: boolean;
};

type EditableUser = {
  id: string;
  username: string | null;
  email: string | null;
  phoneNumber: string | null;
  registrationStatus: "ACTIVE" | "INACTIVE";
  isLoginEnabled: boolean;
  emailVerifiedAt: string | null;
  passwordSetAt: string | null;
  linkedPlayerId: string | null;
  isGlobalAdmin: boolean;
  groupMemberships: GroupMembershipSummary[];
  assignedRoles: AssignedRoleSummary[];
  permissionOverrides: PermissionOverrideSummary[];
};

type GroupMembershipSummary = {
  id: string;
  groupId: string;
  groupName: string;
  description: string | null;
  isActive: boolean;
  joinedAt: string;
  inheritedRoles: Array<{
    roleKey: string;
    roleName: string;
    scopeType: string;
    scopeId: string;
    createdAt: string;
    expiresAt: string | null;
  }>;
};

type AssignedRoleSummary = {
  source: "DIRECT_ASSIGNMENT" | "LEGACY_LINK" | "GROUP_INHERITED";
  sourceLabel: string;
  sourceGroupName: string | null;
  roleKey: string;
  roleName: string;
  scopeType: string;
  scopeId: string;
  createdAt: string;
  expiresAt: string | null;
};

type PermissionOverrideSummary = {
  permissionKey: string;
  permissionName: string;
  effect: "ALLOW" | "DENY";
  scopeType: string;
  scopeId: string;
  reason: string | null;
  createdAt: string;
  expiresAt: string | null;
};

type PlayerOption = {
  id: string;
  userId: string | null;
  fullName: string;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as { error?: unknown; details?: unknown };

  if (typeof candidate.details === "string" && candidate.details) {
    return candidate.details;
  }

  if (typeof candidate.error === "string" && candidate.error) {
    return candidate.error;
  }

  return fallback;
}

function formatScopeLabel(scopeType: string, scopeId: string) {
  if (scopeType === "GLOBAL") {
    return "Global";
  }

  return scopeId ? `${scopeType}: ${scopeId}` : scopeType;
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDateInAdminTimeZone(parsed) || value;
}

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDateTimeInAdminTimeZone(parsed) || value;
}

export default function UserForm({
  mode,
  userId,
  canAssignGlobalAdmin,
}: UserFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(isEdit);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<"ACTIVE" | "INACTIVE">("INACTIVE");
  const [isLoginEnabled, setIsLoginEnabled] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [linkedPlayerId, setLinkedPlayerId] = useState("");
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [groupMemberships, setGroupMemberships] = useState<GroupMembershipSummary[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<AssignedRoleSummary[]>([]);
  const [permissionOverrides, setPermissionOverrides] = useState<PermissionOverrideSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      try {
        setLoadingPlayers(true);

        const response = await fetch("/api/players", {
          cache: "no-store",
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, "Failed to load players."));
        }

        if (cancelled) {
          return;
        }

        const nextPlayers = (Array.isArray(payload) ? payload : []).map((player) => ({
          id: String(player.id),
          userId: player.userId ? String(player.userId) : null,
          fullName: [player.firstName, player.middleInitial, player.lastName]
            .filter(Boolean)
            .join(" "),
        }));

        setPlayers(nextPlayers);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load players.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPlayers(false);
        }
      }
    }

    void loadPlayers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !userId) {
      return;
    }

    let cancelled = false;

    async function loadUser() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/users/${userId}`, {
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as EditableUser | { error?: string; details?: string } | null;

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, "Failed to load user."));
        }

        if (cancelled || !payload || !("id" in payload)) {
          return;
        }

        setUsername(payload.username ?? "");
        setEmail(payload.email ?? "");
        setPhoneNumber(payload.phoneNumber ?? "");
        setRegistrationStatus(payload.registrationStatus);
        setIsLoginEnabled(payload.isLoginEnabled);
        setEmailVerified(Boolean(payload.emailVerifiedAt));
        setLinkedPlayerId(payload.linkedPlayerId ?? "");
        setIsGlobalAdmin(payload.isGlobalAdmin);
        setHasExistingPassword(Boolean(payload.passwordSetAt));
        setGroupMemberships(Array.isArray(payload.groupMemberships) ? payload.groupMemberships : []);
        setAssignedRoles(Array.isArray(payload.assignedRoles) ? payload.assignedRoles : []);
        setPermissionOverrides(
          Array.isArray(payload.permissionOverrides) ? payload.permissionOverrides : []
        );
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load user.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [isEdit, userId]);

  const playerOptions = useMemo(() => {
    return players
      .filter((player) => !player.userId || player.userId === userId)
      .toSorted((left, right) =>
        left.fullName.localeCompare(right.fullName, undefined, {
          sensitivity: "base",
        })
      );
  }, [players, userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(isEdit ? `/api/admin/users/${userId}` : "/api/admin/users", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          phoneNumber,
          registrationStatus,
          isLoginEnabled,
          emailVerified,
          password,
          linkedPlayerId: linkedPlayerId || null,
          isGlobalAdmin,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Failed to save user."));
      }

      notifyAdminAuthChanged();
      router.push("/admin/security/users");
      router.refresh();
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendInvite() {
    if (!isEdit || !userId) {
      return;
    }

    try {
      setSendingInvite(true);
      setError(null);
      setInviteMessage(null);
      setInviteLink(null);

      const response = await fetch(`/api/admin/users/${userId}/invite`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; details?: string; message?: string; inviteLink?: string | null }
        | null;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Failed to send invitation."));
      }

      setInviteMessage(payload?.message || "Invitation sent.");
      setInviteLink(payload?.inviteLink ?? null);
    } catch (inviteError) {
      console.error(inviteError);
      setError(inviteError instanceof Error ? inviteError.message : "Failed to send invitation.");
    } finally {
      setSendingInvite(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <p>Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{isEdit ? "Edit User" : "Add User"}</h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update login access, linked player details, and review inherited security access."
              : "Create a new platform user account and optionally grant global admin access."}
          </p>
        </div>

        <Link
          href="/admin/security/users"
          className="admin-player-form-button admin-player-form-button-secondary"
        >
          <FiArrowLeft />
          <span>Back to Users</span>
        </Link>
      </div>

      <div className="admin-card">
        <form onSubmit={handleSubmit} className="admin-form">
          {error ? <p className="admin-form-error">{error}</p> : null}
          {inviteMessage ? (
            <p className="login-form-status login-form-status-success">{inviteMessage}</p>
          ) : null}
          {inviteLink ? (
            <p className="login-form-status login-form-status-info">
              Development invite link: <a href={inviteLink}>{inviteLink}</a>
            </p>
          ) : null}

          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label htmlFor="username" className="admin-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="admin-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="email" className="admin-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="admin-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="phoneNumber" className="admin-label">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="text"
                className="admin-input"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="registrationStatus" className="admin-label">
                Registration Status
              </label>
              <select
                id="registrationStatus"
                className="admin-select"
                value={registrationStatus}
                onChange={(event) =>
                  setRegistrationStatus(event.target.value === "ACTIVE" ? "ACTIVE" : "INACTIVE")
                }
              >
                <option value="INACTIVE">Inactive</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="linkedPlayerId" className="admin-label">
                Linked Player
              </label>
              <select
                id="linkedPlayerId"
                className="admin-select"
                value={linkedPlayerId}
                onChange={(event) => setLinkedPlayerId(event.target.value)}
                disabled={loadingPlayers}
              >
                <option value="">No linked player</option>
                {playerOptions.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="password" className="admin-label">
                {isEdit ? "Set New Password" : "Password"}
              </label>
              <PasswordField
                id="password"
                className="admin-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  isEdit && hasExistingPassword
                    ? "Leave blank to keep the current password"
                    : "Required when login is enabled"
                }
                autoComplete={isEdit ? "new-password" : "current-password"}
              />
            </div>

            <label className="admin-security-checkbox admin-form-field-full">
              <input
                type="checkbox"
                checked={isLoginEnabled}
                onChange={(event) => setIsLoginEnabled(event.target.checked)}
              />
              <span>Enable login for this user</span>
            </label>

            <label className="admin-security-checkbox admin-form-field-full">
              <input
                type="checkbox"
                checked={emailVerified}
                onChange={(event) => setEmailVerified(event.target.checked)}
              />
              <span>Mark email as verified</span>
            </label>

            {canAssignGlobalAdmin ? (
              <label className="admin-security-checkbox admin-form-field-full">
                <input
                  type="checkbox"
                  checked={isGlobalAdmin}
                  onChange={(event) => setIsGlobalAdmin(event.target.checked)}
                />
                <span>Grant global administrator access</span>
              </label>
            ) : null}
          </div>

          <div className="admin-form-actions">
            <Link
              href="/admin/security/users"
              className="admin-player-form-button admin-player-form-button-secondary"
            >
              <FiArrowLeft />
              <span>Cancel</span>
            </Link>
            {isEdit ? (
              <button
                type="button"
                className="admin-player-form-button admin-player-form-button-secondary"
                onClick={() => void handleSendInvite()}
                disabled={sendingInvite || saving}
              >
                <FiMail />
                <span>{sendingInvite ? "Sending invite..." : "Send Invite"}</span>
              </button>
            ) : null}
            <button
              type="submit"
              className={`admin-player-form-button ${
                isEdit
                  ? "admin-player-form-button-primary"
                  : "admin-player-form-button-create"
              }`}
              disabled={saving}
            >
              {isEdit ? <FiSave /> : <FiUserPlus />}
              <span>
                {saving ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save User" : "Create User"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {isEdit ? (
        <div className="admin-security-stack">
          <section className="admin-security-panel admin-table-card">
            <div className="admin-security-panel-header">
              <div>
                <p className="admin-security-kicker">Groups</p>
                <h2>Group Memberships</h2>
                <p>Groups determine inherited role assignments for this user.</p>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Status</th>
                    <th>Inherited Roles</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {groupMemberships.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-security-empty-cell">
                        This user is not a member of any groups.
                      </td>
                    </tr>
                  ) : (
                    groupMemberships.map((membership) => (
                      <tr key={membership.id}>
                        <td>
                          <div className="admin-security-cell-stack">
                            <strong>{membership.groupName}</strong>
                            <span className="admin-security-muted">
                              {membership.description || "No description"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`admin-security-badge ${
                              membership.isActive
                                ? "admin-security-badge-positive"
                                : "admin-security-badge-warning"
                            }`}
                          >
                            {membership.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          {membership.inheritedRoles.length === 0
                            ? "No inherited roles"
                            : membership.inheritedRoles
                                .map((role) => `${role.roleName} (${formatScopeLabel(role.scopeType, role.scopeId)})`)
                                .join(", ")}
                        </td>
                        <td>{formatDateTimeLabel(membership.joinedAt)}</td>
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
                <p className="admin-security-kicker">Roles</p>
                <h2>Assigned Roles</h2>
                <p>Direct and inherited role grants are listed with their source and scope.</p>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Source</th>
                    <th>Scope</th>
                    <th>Created</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-security-empty-cell">
                        No roles are currently assigned to this user.
                      </td>
                    </tr>
                  ) : (
                    assignedRoles.map((role, index) => (
                      <tr key={`${role.source}-${role.roleKey}-${role.scopeType}-${role.scopeId}-${index}`}>
                        <td>
                          <div className="admin-security-cell-stack">
                            <strong>{role.roleName}</strong>
                            <span className="admin-security-muted">{role.roleKey}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-security-cell-stack">
                            <span>{role.sourceLabel}</span>
                            {role.sourceGroupName ? (
                              <span className="admin-security-muted">{role.sourceGroupName}</span>
                            ) : null}
                          </div>
                        </td>
                        <td>{formatScopeLabel(role.scopeType, role.scopeId)}</td>
                        <td>{formatDateTimeLabel(role.createdAt)}</td>
                        <td>{formatDateLabel(role.expiresAt)}</td>
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
                <p className="admin-security-kicker">Overrides</p>
                <h2>Scoped Permissions</h2>
                <p>Per-user permission overrides remain explicit and auditable here.</p>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Effect</th>
                    <th>Scope</th>
                    <th>Reason</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionOverrides.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="admin-security-empty-cell">
                        No scoped permission overrides are configured.
                      </td>
                    </tr>
                  ) : (
                    permissionOverrides.map((override) => (
                      <tr
                        key={`${override.permissionKey}-${override.scopeType}-${override.scopeId}-${override.effect}`}
                      >
                        <td>
                          <div className="admin-security-cell-stack">
                            <strong>{override.permissionName}</strong>
                            <span className="admin-security-muted">{override.permissionKey}</span>
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
                        <td>{formatScopeLabel(override.scopeType, override.scopeId)}</td>
                        <td>{override.reason || "-"}</td>
                        <td>{formatDateLabel(override.expiresAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}