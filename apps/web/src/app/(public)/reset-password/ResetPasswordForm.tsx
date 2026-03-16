"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import PasswordField from "@/components/admin/PasswordField";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const isConfirmMode = token.length > 0;
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setResetLink(null);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; resetLink?: string | null }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to request password reset.");
      }

      setSuccess(
        payload?.message || "If that account exists, a password reset link has been generated."
      );
      setResetLink(payload?.resetLink ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to request password reset."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (password.length < 10) {
        throw new Error("Use a password that is at least 10 characters long.");
      }

      if (password !== confirmPassword) {
        throw new Error("The password confirmation does not match.");
      }

      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to reset password.");
      }

      router.push("/login?reset=success");
      router.refresh();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error ? confirmError.message : "Failed to reset password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return isConfirmMode ? (
    <form className="login-form" onSubmit={handleConfirmReset}>
      <label className="admin-form-field">
        <span className="admin-label">New password</span>
        <PasswordField
          className="admin-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      <label className="admin-form-field">
        <span className="admin-label">Confirm password</span>
        <PasswordField
          className="admin-input"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <div className="account-settings-actions">
        <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Set new password"}
        </button>
        <Link href="/login" className="admin-link-button">
          Back to sign in
        </Link>
      </div>
    </form>
  ) : (
    <form className="login-form" onSubmit={handleRequestReset}>
      <label className="admin-form-field">
        <span className="admin-label">Email or username</span>
        <input
          type="text"
          className="admin-input"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      {error ? <p className="admin-form-error">{error}</p> : null}
      {success ? (
        <p className="login-form-status login-form-status-success">{success}</p>
      ) : null}
      {resetLink ? (
        <p className="login-form-status login-form-status-info">
          Development reset link: <a href={resetLink}>{resetLink}</a>
        </p>
      ) : null}

      <div className="account-settings-actions">
        <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate reset link"}
        </button>
        <Link href="/login" className="admin-link-button">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}