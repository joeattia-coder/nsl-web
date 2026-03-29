"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import PasswordField from "@/components/admin/PasswordField";
import TermsFooterLink from "../TermsFooterLink";
import { useAdminAuth } from "../AdminAuthContext";

type TermsSnapshot = {
  id: string | null;
  title: string;
  contentHtml: string;
  publishedAt: string | null;
  publishedAtLabel: string | null;
  exists: boolean;
};

const ACCEPTED_TERMS_STORAGE_KEY = "nsl-accepted-terms-version";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCurrentUser } = useAdminAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestTerms, setLatestTerms] = useState<TermsSnapshot | null>(null);
  const [storedAcceptedTermsVersionId, setStoredAcceptedTermsVersionId] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const nextPath = searchParams.get("next") || searchParams.get("nextPath") || "";
  const resetStatus = searchParams.get("reset") === "success";
  const inviteStatus = searchParams.get("invite") === "success";
  const verifiedStatus = searchParams.get("verified");
  const latestTermsVersionId = latestTerms?.exists ? latestTerms.id : null;
  const hasAcceptedCurrentTerms = Boolean(
    latestTermsVersionId && storedAcceptedTermsVersionId === latestTermsVersionId
  );
  const requiresTermsAcceptance = Boolean(latestTermsVersionId) && !hasAcceptedCurrentTerms;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setStoredAcceptedTermsVersionId(window.localStorage.getItem(ACCEPTED_TERMS_STORAGE_KEY));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestTerms() {
      try {
        const response = await fetch("/api/terms/latest", { cache: "no-store" });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.details || payload?.error || "Failed to load Terms of Service.");
        }

        if (!cancelled) {
          setLatestTerms(payload.version as TermsSnapshot);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setLatestTerms({
            id: null,
            title: "Terms of Service",
            contentHtml: "",
            publishedAt: null,
            publishedAtLabel: null,
            exists: false,
          });
        }
      }
    }

    void loadLatestTerms();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (requiresTermsAcceptance && !agreedToTerms) {
      setError("You must agree to the current Terms of Service before signing in.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const acceptedTermsVersionId = latestTermsVersionId
      ? requiresTermsAcceptance
        ? agreedToTerms
          ? latestTermsVersionId
          : null
        : storedAcceptedTermsVersionId
      : null;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
          next: nextPath,
          acceptedTermsVersionId,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to log in.");
      }

      if (latestTermsVersionId && typeof window !== "undefined") {
        window.localStorage.setItem(ACCEPTED_TERMS_STORAGE_KEY, latestTermsVersionId);
        setStoredAcceptedTermsVersionId(latestTermsVersionId);
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
          Account setup complete. You can now sign in with your password.
        </p>
      ) : null}

      {verifiedStatus === "success" ? (
        <p className="login-form-status login-form-status-success">
          Email verified. Your player account is now active.
        </p>
      ) : null}

      {verifiedStatus === "invalid" ? (
        <p className="login-form-status login-form-status-warning">
          That verification link is invalid or expired.
        </p>
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

      <div className="login-form-row">
        <span className="login-support-copy">New player?</span>
        <Link href="/register" className="login-form-link">
          Register
        </Link>
      </div>

      {requiresTermsAcceptance ? (
        <label className="admin-checkbox-inline login-terms-checkbox">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => setAgreedToTerms(event.target.checked)}
            required
          />
          <span>
            I agree to the <TermsFooterLink className="login-terms-link" label="Terms of Service" />.
          </span>
        </label>
      ) : null}

      {error ? <p className="admin-form-error">{error}</p> : null}

      <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}