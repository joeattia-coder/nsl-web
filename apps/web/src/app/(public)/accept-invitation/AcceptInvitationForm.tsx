"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import PasswordField from "@/components/admin/PasswordField";

function validatePasswordStrength(password: string) {
  if (password.length < 10) {
    return "Use a password that is at least 10 characters long.";
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z\d]/.test(password);

  if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
    return "Use at least one uppercase letter, one lowercase letter, one number, and one symbol.";
  }

  return null;
}

type InvitationPayload = {
  email: string;
  playerName: string | null;
  expiresAt: string;
};

export default function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [invitation, setInvitation] = useState<InvitationPayload | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setInvitationError("Invitation token is missing.");
      setIsLoadingInvitation(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoadingInvitation(true);
      setInvitationError(null);

      try {
        const response = await fetch(`/api/auth/invitations/accept?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => null)) as
          | { error?: string; invitation?: InvitationPayload }
          | null;

        if (!response.ok || !payload?.invitation) {
          throw new Error(payload?.error || "Invalid invitation link.");
        }

        if (cancelled) {
          return;
        }

        setInvitation(payload.invitation);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setInvitationError(loadError instanceof Error ? loadError.message : "Invalid invitation link.");
      } finally {
        if (!cancelled) {
          setIsLoadingInvitation(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const passwordError = validatePasswordStrength(password);

    if (passwordError) {
      setSubmitError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("The password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/invitations/accept", {
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
        throw new Error(payload?.error || "Failed to accept invitation.");
      }

      router.push("/login?invite=success");
      router.refresh();
    } catch (submitError) {
      setSubmitError(
        submitError instanceof Error ? submitError.message : "Failed to accept invitation."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInvitation) {
    return <p className="login-form-status login-form-status-info">Validating invitation...</p>;
  }

  if (invitationError || !invitation) {
    return (
      <div className="login-form">
        <p className="login-form-status login-form-status-warning">
          {invitationError || "That invitation link is invalid or has expired."}
        </p>
        <Link href="/login" className="admin-link-button">
          Back to sign in
        </Link>
      </div>
    );
  }

  const expiryLabel = new Date(invitation.expiresAt).toLocaleString();

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <p className="login-form-status login-form-status-info">
        Invitation for <strong>{invitation.email}</strong>
        {invitation.playerName ? ` (${invitation.playerName})` : ""}. This link expires {expiryLabel}.
      </p>

      <p className="login-support-copy">
        After setting your password, you can also sign in with Google or Facebook using this same email.
      </p>

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

      {submitError ? <p className="admin-form-error">{submitError}</p> : null}

      <div className="account-settings-actions">
        <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Complete account setup"}
        </button>
        <Link href="/login" className="admin-link-button">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
