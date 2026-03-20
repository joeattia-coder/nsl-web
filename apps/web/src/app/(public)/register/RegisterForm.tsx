"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { FaFacebookF, FaGoogle } from "react-icons/fa6";
import PasswordField from "@/components/admin/PasswordField";

type Challenge = {
  prompt: string;
  token: string;
};

function getAuthMessage(errorCode: string | null) {
  switch (errorCode) {
    case "social_not_configured":
      return "That social login provider is not configured yet.";
    case "social_auth_failed":
      return "The social sign-up attempt failed. Please try again.";
    case "social_state_invalid":
      return "That social sign-up session expired. Please try again.";
    case "social_provider_invalid":
    case "social_profile_invalid":
      return "That social provider response was invalid.";
    case "social_email_required":
      return "That social account did not provide an email address. Try another provider or use the registration form.";
    case "social_account_exists":
      return "An account with that email already exists. Try signing in instead.";
    default:
      return null;
  }
}

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const oauthError = getAuthMessage(searchParams.get("error"));

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationPrompt, setVerificationPrompt] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  async function loadChallenge() {
    setIsLoadingChallenge(true);

    try {
      const response = await fetch("/api/auth/human-verification", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { challenge?: Challenge; error?: string }
        | null;

      if (!response.ok || !payload?.challenge) {
        throw new Error(payload?.error || "Failed to load human verification.");
      }

      setVerificationPrompt(payload.challenge.prompt);
      setVerificationToken(payload.challenge.token);
      setVerificationAnswer("");
    } catch (challengeError) {
      setError(
        challengeError instanceof Error
          ? challengeError.message
          : "Failed to load human verification."
      );
    } finally {
      setIsLoadingChallenge(false);
    }
  }

  useEffect(() => {
    void loadChallenge();
  }, []);

  const googleHref = "/api/auth/oauth/google?mode=register";
  const facebookHref = "/api/auth/oauth/facebook?mode=register";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setVerificationLink(null);

    if (password !== confirmPassword) {
      setError("The password confirmation does not match.");
      return;
    }

    if (!verificationToken) {
      setError("Human verification is not ready yet. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          dateOfBirth,
          phoneNumber,
          username,
          email,
          password,
          verificationToken,
          verificationAnswer,
          website,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string; verificationLink?: string | null }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to register account.");
      }

      setSuccess(
        payload?.message || "Registration submitted. Check your email to verify your account."
      );
      setVerificationLink(payload?.verificationLink ?? null);
      setPassword("");
      setConfirmPassword("");
      setVerificationAnswer("");
      setWebsite("");
      await loadChallenge();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to register account."
      );
      await loadChallenge();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Player Registration</h1>
          <p className="admin-page-subtitle">
            Register with the form and verify your email, or use Google/Facebook for instant account creation.
          </p>
        </div>
      </div>
      <div className="admin-card admin-player-form-card">
        <form onSubmit={handleSubmit} className="admin-form">
          {oauthError ? (
            <p className="login-form-status login-form-status-warning">{oauthError}</p>
          ) : null}

          {success ? (
            <p className="login-form-status login-form-status-success">{success}</p>
          ) : null}

          {verificationLink ? (
            <p className="login-form-status login-form-status-info">
              Development verification link: <a href={verificationLink}>{verificationLink}</a>
            </p>
          ) : null}

          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-label">First name</label>
              <input
                type="text"
                className="admin-input"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Last name</label>
              <input
                type="text"
                className="admin-input"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Date of birth (optional)</label>
              <input
                type="date"
                className="admin-input"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Phone number (optional)</label>
              <input
                type="text"
                className="admin-input"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Username</label>
              <input
                type="text"
                className="admin-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Email</label>
              <input
                type="email"
                className="admin-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Password</label>
              <PasswordField
                className="admin-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Confirm password</label>
              <PasswordField
                className="admin-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Human verification</label>
              <span className="login-support-copy">
                {isLoadingChallenge ? "Loading challenge..." : verificationPrompt}
              </span>
              <input
                type="text"
                className="admin-input"
                value={verificationAnswer}
                onChange={(event) => setVerificationAnswer(event.target.value)}
                required
                disabled={isLoadingChallenge}
              />
            </div>
            <div className="admin-form-field" style={{ display: "none" }} aria-hidden="true">
              <span>Website</span>
              <input
                tabIndex={-1}
                autoComplete="off"
                type="text"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>
          </div>
          {error ? <p className="admin-form-error">{error}</p> : null}
          <button type="submit" className="admin-primary-button" disabled={isSubmitting || isLoadingChallenge}>
            {isSubmitting ? "Registering..." : "Register"}
          </button>
          <div className="login-divider" aria-hidden="true">
            <span>or register with</span>
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
            Using social registration creates your player account immediately. Form registration requires email verification.
          </p>
          <div className="account-settings-actions">
            <Link href="/login" className="admin-link-button">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
}
