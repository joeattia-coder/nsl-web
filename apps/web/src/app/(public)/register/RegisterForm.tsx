"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import CountrySelect from "@/components/CountrySelect";
import PasswordField from "@/components/admin/PasswordField";

function normalizeMiddleInitial(value: string) {
  return value.replace(/[^a-z]/gi, "").slice(0, 1).toUpperCase();
}

export default function RegisterForm() {
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationPrompt, setVerificationPrompt] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadChallenge() {
    setIsLoadingChallenge(true);
    try {
      const response = await fetch("/api/auth/human-verification", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to load human verification.");
      }
      const data = await response.json();
      if (data.ok && data.challenge) {
        setVerificationPrompt(data.challenge.prompt || "");
        setVerificationToken(data.challenge.token || "");
      } else {
        setVerificationPrompt("");
        setVerificationToken("");
        throw new Error("Failed to load human verification.");
      }
    } catch (challengeError) {
      setError(
        challengeError instanceof Error
          ? challengeError.message
          : "Failed to load human verification."
      );
      setVerificationPrompt("");
      setVerificationToken("");
    } finally {
      setIsLoadingChallenge(false);
    }
  }

  useEffect(() => {
    void loadChallenge();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

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
          middleInitial,
          lastName,
          email,
          phoneNumber,
          country,
          username,
          password,
          verificationToken,
          verificationAnswer,
          website,
        }),
      });
      if (response.ok) {
        setShowVerificationModal(true);
      } else {
        const data = await response.json();
        setError(data?.error || "Registration failed.");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-form-container">
      <>
        <h2 className="register-form-title">Player Registration</h2>
        <form className="admin-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="admin-form-grid">
            <div className="admin-form-field admin-form-field-full register-name-grid">
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
              <div className="admin-form-field register-middle-initial-field">
                <label className="admin-label">Middle initial (optional)</label>
                <input
                  type="text"
                  className="admin-input register-middle-initial-input"
                  value={middleInitial}
                  onChange={(event) => setMiddleInitial(normalizeMiddleInitial(event.target.value))}
                  autoComplete="off"
                  inputMode="text"
                  maxLength={1}
                  pattern="[A-Za-z]"
                  title="Enter one letter"
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
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Email address</label>
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
              <label className="admin-label">Country</label>
              <CountrySelect
                value={country}
                onChange={setCountry}
                required
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
          <p className="login-support-copy">Registration requires email verification before sign-in.</p>
          <div className="account-settings-actions">
            <Link href="/login" className="admin-link-button">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
        {showVerificationModal ? (
          <div className="admin-modal-backdrop" onClick={() => setShowVerificationModal(false)} role="presentation">
            <div
              className="admin-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="register-verification-title"
            >
              <h2 id="register-verification-title" className="admin-modal-title">
                Verify your email
              </h2>
              <p className="admin-modal-text">
                Your account has been created. Check your email and open the verification link before signing in.
              </p>
              <div className="admin-modal-actions">
                <Link href="/login" className="admin-modal-button admin-modal-button-primary">
                  Go to login
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </>
    </div>
  );
}
