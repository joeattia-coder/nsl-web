"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import CountrySelect from "@/components/CountrySelect";
import PasswordField from "@/components/admin/PasswordField";
import { FiCheck, FiX } from "react-icons/fi";

function normalizeMiddleInitial(value: string) {
  return value.replace(/[^a-z]/gi, "").slice(0, 1).toUpperCase();
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 10;

type RegisterFieldName =
  | "firstName"
  | "lastName"
  | "country"
  | "email"
  | "username"
  | "password"
  | "confirmPassword"
  | "verificationAnswer";

type RegisterFieldErrors = Partial<Record<RegisterFieldName, string>>;

type AvailabilityState = {
  status: "idle" | "checking" | "available" | "duplicate";
  value: string;
};

function validatePasswordStrength(password: string) {
  if (!password.trim()) {
    return "Password is required.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use a password that is at least ${MIN_PASSWORD_LENGTH} characters long.`;
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

function validateRegisterFields(values: {
  firstName: string;
  lastName: string;
  country: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  verificationAnswer: string;
}) {
  const errors: RegisterFieldErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!values.country.trim()) {
    errors.country = "Country is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.username.trim()) {
    errors.username = "Username is required.";
  } else if (!USERNAME_PATTERN.test(values.username.trim())) {
    errors.username =
      "Username must be 3-30 characters and can only include letters, numbers, periods, underscores, and hyphens.";
  }

  const passwordError = validatePasswordStrength(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = "Confirm password is required.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "The password confirmation does not match.";
  }

  if (!values.verificationAnswer.trim()) {
    errors.verificationAnswer = "Human verification is required.";
  }

  return errors;
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
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState<AvailabilityState>({
    status: "idle",
    value: "",
  });
  const [usernameAvailability, setUsernameAvailability] = useState<AvailabilityState>({
    status: "idle",
    value: "",
  });
  const emailAvailabilityRequestRef = useRef(0);
  const usernameAvailabilityRequestRef = useRef(0);

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

  const applyFieldValidation = (nextValues: {
    firstName?: string;
    lastName?: string;
    country?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    verificationAnswer?: string;
  }) => {
    const mergedValues = {
      firstName,
      lastName,
      country,
      email,
      username,
      password,
      confirmPassword,
      verificationAnswer,
      ...nextValues,
    };

    setFieldErrors(validateRegisterFields(mergedValues));
  };

  const getVisibleFieldError = (fieldName: RegisterFieldName) => {
    if (
      fieldName === "confirmPassword" &&
      confirmPassword.trim() &&
      password !== confirmPassword
    ) {
      return "The password confirmation does not match.";
    }

    if (!submitAttempted) {
      return null;
    }

    return fieldErrors[fieldName] ?? null;
  };

  const checkAvailability = async (field: "email" | "username", value: string) => {
    const trimmedValue = value.trim();

    if (field === "email") {
      if (!trimmedValue || !EMAIL_PATTERN.test(trimmedValue)) {
        setEmailAvailability({ status: "idle", value: trimmedValue });
        return;
      }

      const requestId = ++emailAvailabilityRequestRef.current;
      setEmailAvailability({ status: "checking", value: trimmedValue });

      try {
        const response = await fetch(
          `/api/auth/register/availability?field=email&value=${encodeURIComponent(trimmedValue)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (requestId !== emailAvailabilityRequestRef.current) {
          return;
        }

        if (!response.ok) {
          setEmailAvailability({ status: "idle", value: trimmedValue });
          return;
        }

        const data = await response.json();
        setEmailAvailability({
          status: data?.duplicate ? "duplicate" : "available",
          value: trimmedValue,
        });
      } catch {
        if (requestId === emailAvailabilityRequestRef.current) {
          setEmailAvailability({ status: "idle", value: trimmedValue });
        }
      }

      return;
    }

    if (!trimmedValue || !USERNAME_PATTERN.test(trimmedValue)) {
      setUsernameAvailability({ status: "idle", value: trimmedValue });
      return;
    }

    const requestId = ++usernameAvailabilityRequestRef.current;
    setUsernameAvailability({ status: "checking", value: trimmedValue });

    try {
      const response = await fetch(
        `/api/auth/register/availability?field=username&value=${encodeURIComponent(trimmedValue)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (requestId !== usernameAvailabilityRequestRef.current) {
        return;
      }

      if (!response.ok) {
        setUsernameAvailability({ status: "idle", value: trimmedValue });
        return;
      }

      const data = await response.json();
      setUsernameAvailability({
        status: data?.duplicate ? "duplicate" : "available",
        value: trimmedValue,
      });
    } catch {
      if (requestId === usernameAvailabilityRequestRef.current) {
        setUsernameAvailability({ status: "idle", value: trimmedValue });
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitAttempted(true);
    const nextFieldErrors = validateRegisterFields({
      firstName,
      lastName,
      country,
      email,
      username,
      password,
      confirmPassword,
      verificationAnswer,
    });

    if (emailAvailability.status === "duplicate") {
      nextFieldErrors.email = "An account with this email address already exists. Try signing in instead.";
    }

    if (usernameAvailability.status === "duplicate") {
      nextFieldErrors.username = "That username is already in use. Choose another username.";
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
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
        if (data?.field === "email") {
          setFieldErrors((current) => ({
            ...current,
            email: data?.error || "An account with this email address already exists.",
          }));
        } else if (data?.field === "username") {
          setFieldErrors((current) => ({
            ...current,
            username: data?.error || "That username is already in use.",
          }));
        } else {
          setError(data?.error || "Registration failed.");
        }
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
        <form className="admin-form" onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-label">First name</label>
              <input
                type="text"
                className="admin-input"
                value={firstName}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setFirstName(nextValue);
                  applyFieldValidation({ firstName: nextValue });
                }}
                aria-invalid={fieldErrors.firstName ? "true" : "false"}
                aria-describedby={fieldErrors.firstName ? "register-first-name-error" : undefined}
                required
              />
              {getVisibleFieldError("firstName") ? (
                <p id="register-first-name-error" className="admin-form-error">
                  {getVisibleFieldError("firstName")}
                </p>
              ) : null}
            </div>
            <div className="admin-form-field">
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
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setLastName(nextValue);
                  applyFieldValidation({ lastName: nextValue });
                }}
                aria-invalid={fieldErrors.lastName ? "true" : "false"}
                aria-describedby={fieldErrors.lastName ? "register-last-name-error" : undefined}
                required
              />
              {getVisibleFieldError("lastName") ? (
                <p id="register-last-name-error" className="admin-form-error">
                  {getVisibleFieldError("lastName")}
                </p>
              ) : null}
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
              <label className="admin-label">Email address</label>
              <div className="register-availability-field">
                <input
                  type="email"
                  className="admin-input register-availability-input"
                  value={email}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setEmail(nextValue);
                    emailAvailabilityRequestRef.current += 1;
                    setEmailAvailability({ status: "idle", value: nextValue.trim() });
                    applyFieldValidation({ email: nextValue });
                  }}
                  onBlur={() => {
                    void checkAvailability("email", email);
                  }}
                  autoComplete="email"
                  aria-invalid={getVisibleFieldError("email") ? "true" : "false"}
                  aria-describedby={getVisibleFieldError("email") ? "register-email-error" : undefined}
                  required
                />
                {emailAvailability.status === "available" || emailAvailability.status === "duplicate" ? (
                  <span
                    className={`register-availability-badge ${
                      emailAvailability.status === "available"
                        ? "register-availability-badge-valid"
                        : "register-availability-badge-invalid"
                    }`}
                    title={
                      emailAvailability.status === "duplicate"
                        ? "Email address already exists."
                        : undefined
                    }
                    aria-hidden="true"
                  >
                    {emailAvailability.status === "available" ? <FiCheck /> : <FiX />}
                  </span>
                ) : null}
              </div>
              {getVisibleFieldError("email") ? (
                <p id="register-email-error" className="admin-form-error">
                  {getVisibleFieldError("email")}
                </p>
              ) : null}
            </div>
            <div className="admin-form-field">
              <label className="admin-label">Country</label>
              <CountrySelect
                value={country}
                onChange={(nextValue) => {
                  setCountry(nextValue);
                  applyFieldValidation({ country: nextValue });
                }}
                ariaInvalid={Boolean(fieldErrors.country)}
                describedBy={fieldErrors.country ? "register-country-error" : undefined}
                required
              />
              {getVisibleFieldError("country") ? (
                <p id="register-country-error" className="admin-form-error">
                  {getVisibleFieldError("country")}
                </p>
              ) : null}
            </div>
            <div className="admin-form-field admin-form-field-full">
              <label className="admin-label">Username</label>
              <div className="register-availability-field">
                <input
                  type="text"
                  className="admin-input register-availability-input"
                  value={username}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setUsername(nextValue);
                    usernameAvailabilityRequestRef.current += 1;
                    setUsernameAvailability({ status: "idle", value: nextValue.trim() });
                    applyFieldValidation({ username: nextValue });
                  }}
                  onBlur={() => {
                    void checkAvailability("username", username);
                  }}
                  autoComplete="username"
                  aria-invalid={getVisibleFieldError("username") ? "true" : "false"}
                  aria-describedby={getVisibleFieldError("username") ? "register-username-error" : undefined}
                  required
                />
                {usernameAvailability.status === "available" || usernameAvailability.status === "duplicate" ? (
                  <span
                    className={`register-availability-badge ${
                      usernameAvailability.status === "available"
                        ? "register-availability-badge-valid"
                        : "register-availability-badge-invalid"
                    }`}
                    aria-hidden="true"
                  >
                    {usernameAvailability.status === "available" ? <FiCheck /> : <FiX />}
                  </span>
                ) : null}
              </div>
              {getVisibleFieldError("username") ? (
                <p id="register-username-error" className="admin-form-error">
                  {getVisibleFieldError("username")}
                </p>
              ) : null}
            </div>
            <div className="admin-form-field admin-form-field-full">
              <label className="admin-label">Password</label>
              <PasswordField
                className="admin-input"
                value={password}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setPassword(nextValue);
                  applyFieldValidation({ password: nextValue });
                }}
                autoComplete="new-password"
                aria-invalid={fieldErrors.password ? "true" : "false"}
                aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
                required
              />
              {getVisibleFieldError("password") ? (
                <p id="register-password-error" className="admin-form-error">
                  {getVisibleFieldError("password")}
                </p>
              ) : null}
            </div>
            <div className="admin-form-field admin-form-field-full">
              <label className="admin-label">Confirm password</label>
              <PasswordField
                className="admin-input"
                value={confirmPassword}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setConfirmPassword(nextValue);
                  applyFieldValidation({ confirmPassword: nextValue });
                }}
                autoComplete="new-password"
                aria-invalid={fieldErrors.confirmPassword ? "true" : "false"}
                aria-describedby={fieldErrors.confirmPassword ? "register-confirm-password-error" : undefined}
                required
              />
              {getVisibleFieldError("confirmPassword") ? (
                <p id="register-confirm-password-error" className="admin-form-error">
                  {getVisibleFieldError("confirmPassword")}
                </p>
              ) : null}
            </div>
            <div className="admin-form-field admin-form-field-full">
              <label className="admin-label">Human verification</label>
              <span className="login-support-copy">
                {isLoadingChallenge ? "Loading challenge..." : verificationPrompt}
              </span>
              <input
                type="text"
                className="admin-input"
                value={verificationAnswer}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setVerificationAnswer(nextValue);
                  applyFieldValidation({ verificationAnswer: nextValue });
                }}
                aria-invalid={fieldErrors.verificationAnswer ? "true" : "false"}
                aria-describedby={fieldErrors.verificationAnswer ? "register-verification-error" : undefined}
                required
                disabled={isLoadingChallenge}
              />
              {getVisibleFieldError("verificationAnswer") ? (
                <p id="register-verification-error" className="admin-form-error">
                  {getVisibleFieldError("verificationAnswer")}
                </p>
              ) : null}
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
          <button
            type="submit"
            className="admin-primary-button"
            disabled={isSubmitting || isLoadingChallenge}
          >
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
