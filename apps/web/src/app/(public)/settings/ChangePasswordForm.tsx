"use client";

import { FormEvent, useState } from "react";
import PasswordField from "@/components/admin/PasswordField";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 10) {
      setError("Use a password that is at least 10 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to change password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to change password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="admin-form-field">
        <span className="admin-label">Current password</span>
        <PasswordField
          className="admin-input"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>

      <label className="admin-form-field">
        <span className="admin-label">New password</span>
        <PasswordField
          className="admin-input"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      <label className="admin-form-field">
        <span className="admin-label">Confirm new password</span>
        <PasswordField
          className="admin-input"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      {error ? <p className="admin-form-error">{error}</p> : null}
      {success ? <p className="login-form-status login-form-status-success">{success}</p> : null}

      <div className="account-settings-actions">
        <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Change password"}
        </button>
      </div>
    </form>
  );
}
