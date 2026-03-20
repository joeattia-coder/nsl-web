"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { FaFacebookF, FaGoogle } from "react-icons/fa6";
import PasswordField from "@/components/admin/PasswordField";
import { useAdminAuth } from "../AdminAuthContext";

function getAuthMessage(errorCode: string | null) {
  switch (errorCode) {
    case "social_not_configured":
      return "That social login provider is not configured yet.";
    case "social_no_account":
      return "That social account does not match an enabled account.";
    case "social_auth_failed":
      return "The social login attempt failed. Please try again.";
    case "social_state_invalid":
      return "That social login session expired. Please try again.";
    case "social_provider_invalid":
    case "social_profile_invalid":
      return "That social login provider response was invalid.";
    default:
      return null;
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCurrentUser } = useAdminAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "";
  const oauthError = getAuthMessage(searchParams.get("error"));
  const resetStatus = searchParams.get("reset") === "success";
  const inviteStatus = searchParams.get("invite") === "success";
  const googleHref = `/api/auth/oauth/google?next=${encodeURIComponent(nextPath)}`;
  const facebookHref = `/api/auth/oauth/facebook?next=${encodeURIComponent(nextPath)}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password, nextPath }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to log in.");
      }

      await refreshCurrentUser();
      router.push(payload?.nextPath ?? (nextPath || "/profile"));
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to log in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {resetStatus ? (
        <p className="login-form-status login-form-status-success">
          Password updated. Sign in with your new password.
        </p>
      ) : null}

      {inviteStatus ? (
        <p className="login-form-status login-form-status-success">
          Account setup complete. You can sign in with your password, or use Google/Facebook with the same email.
        </p>
      ) : null}

      {oauthError ? (
        <p className="login-form-status login-form-status-warning">{oauthError}</p>
      ) : null}

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

      <label className="admin-form-field">
        <span className="admin-label">Password</span>
        <PasswordField
          className="admin-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <div className="login-form-row">
        <span className="login-support-copy">Use the same admin account you use for Security.</span>
        <Link href="/reset-password" className="login-form-link">
          Forgot password?
        </Link>
      </div>

      {error ? <p className="admin-form-error">{error}</p> : null}

      <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <div className="login-divider" aria-hidden="true">
        <span>or continue with</span>
      </div>

      <div className="social-auth-actions">
        <a href={googleHref} className="social-auth-button social-auth-button-google">
          <FaGoogle aria-hidden="true" />
          <span>Google</span>
        </a>
        <a href={facebookHref} className="social-auth-button social-auth-button-facebook">
          <FaFacebookF aria-hidden="true" />
          <span>Facebook</span>
        </a>
      </div>

      <p className="login-support-copy">
        Social sign-in only works for existing enabled admin accounts and links to the
        matching email address on first use.
      </p>
    </form>
  );
}