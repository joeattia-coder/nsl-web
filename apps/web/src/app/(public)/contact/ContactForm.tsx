"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./ContactPage.module.css";

type Challenge = {
  prompt: string;
  token: string;
};

type ContactFormProps = {
  initialFirstName: string;
  initialLastName: string;
  initialEmail: string;
};

export default function ContactForm({
  initialFirstName,
  initialLastName,
  initialEmail,
}: ContactFormProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationPrompt, setVerificationPrompt] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

      const data = (await response.json()) as { ok?: boolean; challenge?: Challenge };

      if (!data.ok || !data.challenge) {
        throw new Error("Failed to load human verification.");
      }

      setVerificationPrompt(data.challenge.prompt || "");
      setVerificationToken(data.challenge.token || "");
      setVerificationAnswer("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitted(false);

    if (!verificationToken) {
      setError("Human verification is not ready yet. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          subject,
          details,
          verificationToken,
          verificationAnswer,
          website,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to send your message.");
      }

      setSubject("");
      setDetails("");
      setWebsite("");
      setIsSubmitted(true);
      await loadChallenge();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send your message."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setError(null);
    setIsSubmitted(false);
    setSubject("");
    setDetails("");
    setWebsite("");
    setVerificationAnswer("");
  }

  if (isSubmitted) {
    return (
      <div className={styles.confirmationCard}>
        <p className={styles.confirmationEyebrow}>Message received</p>
        <h3 className={styles.confirmationTitle}>Thank you for contacting the National Snooker League</h3>
        <p className={styles.confirmationCopy}>
          Your inquiry has been submitted successfully. A member of our team will review your message and reply within 24 hours.
        </p>
        <div className={styles.confirmationActions}>
          <button type="button" className="admin-primary-button" onClick={handleReset}>
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit} autoComplete="on">
      <div className="admin-form-grid">
        <div className="admin-form-field">
          <label htmlFor="contact-first-name" className="admin-label">First name</label>
          <input
            id="contact-first-name"
            type="text"
            className="admin-input"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
        </div>

        <div className="admin-form-field">
          <label htmlFor="contact-last-name" className="admin-label">Last name</label>
          <input
            id="contact-last-name"
            type="text"
            className="admin-input"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
          />
        </div>

        <div className="admin-form-field admin-form-field-full">
          <label htmlFor="contact-email" className="admin-label">Email</label>
          <input
            id="contact-email"
            type="email"
            className="admin-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="admin-form-field admin-form-field-full">
          <label htmlFor="contact-subject" className="admin-label">Subject</label>
          <input
            id="contact-subject"
            type="text"
            className="admin-input"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={160}
            required
          />
        </div>

        <div className="admin-form-field admin-form-field-full">
          <label htmlFor="contact-details" className="admin-label">Details</label>
          <textarea
            id="contact-details"
            className="admin-textarea"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={8}
            maxLength={5000}
            required
          />
        </div>

        <div className="admin-form-field admin-form-field-full">
          <label htmlFor="contact-verification" className="admin-label">Human verification</label>
          <span className="login-support-copy">
            {isLoadingChallenge ? "Loading challenge..." : verificationPrompt}
          </span>
          <input
            id="contact-verification"
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

      <div className="account-settings-actions">
        <button type="submit" className="admin-primary-button" disabled={isSubmitting || isLoadingChallenge}>
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}