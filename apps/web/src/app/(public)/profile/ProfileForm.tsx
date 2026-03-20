"use client";

import { FormEvent, useMemo, useState } from "react";

type ProfileFormProps = {
  initialData: {
    id: string;
    firstName: string;
    middleInitial: string | null;
    lastName: string;
    dateOfBirth: string | null;
    emailAddress: string | null;
    phoneNumber: string | null;
    photoUrl: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    stateProvince: string | null;
    country: string | null;
    postalCode: string | null;
    updatedAt: string;
  };
};

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [middleInitial, setMiddleInitial] = useState(initialData.middleInitial ?? "");
  const [lastName, setLastName] = useState(initialData.lastName);
  const [dateOfBirth, setDateOfBirth] = useState(initialData.dateOfBirth ?? "");
  const [emailAddress, setEmailAddress] = useState(initialData.emailAddress ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl ?? "");
  const [addressLine1, setAddressLine1] = useState(initialData.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(initialData.addressLine2 ?? "");
  const [city, setCity] = useState(initialData.city ?? "");
  const [stateProvince, setStateProvince] = useState(initialData.stateProvince ?? "");
  const [country, setCountry] = useState(initialData.country ?? "");
  const [postalCode, setPostalCode] = useState(initialData.postalCode ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(initialData.updatedAt);

  const updatedLabel = useMemo(() => {
    return new Date(updatedAt).toLocaleString();
  }, [updatedAt]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          middleInitial,
          lastName,
          dateOfBirth,
          emailAddress,
          phoneNumber,
          photoUrl,
          addressLine1,
          addressLine2,
          city,
          stateProvince,
          country,
          postalCode,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; player?: { updatedAt: string } }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update profile.");
      }

      setSuccess("Profile updated successfully.");

      if (payload?.player?.updatedAt) {
        setUpdatedAt(payload.player.updatedAt);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to update profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="profile-form-grid">
        <label className="admin-form-field">
          <span className="admin-label">First name</span>
          <input
            type="text"
            className="admin-input"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">Middle initial</span>
          <input
            type="text"
            className="admin-input"
            value={middleInitial}
            onChange={(event) => setMiddleInitial(event.target.value)}
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">Last name</span>
          <input
            type="text"
            className="admin-input"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">Date of birth</span>
          <input
            type="date"
            className="admin-input"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">Email address</span>
          <input
            type="email"
            className="admin-input"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">Phone number</span>
          <input
            type="text"
            className="admin-input"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
        </label>

        <label className="admin-form-field profile-form-grid-wide">
          <span className="admin-label">Photo URL</span>
          <input
            type="text"
            className="admin-input"
            value={photoUrl}
            onChange={(event) => setPhotoUrl(event.target.value)}
          />
        </label>

        <label className="admin-form-field profile-form-grid-wide">
          <span className="admin-label">Address line 1</span>
          <input
            type="text"
            className="admin-input"
            value={addressLine1}
            onChange={(event) => setAddressLine1(event.target.value)}
          />
        </label>

        <label className="admin-form-field profile-form-grid-wide">
          <span className="admin-label">Address line 2</span>
          <input
            type="text"
            className="admin-input"
            value={addressLine2}
            onChange={(event) => setAddressLine2(event.target.value)}
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">City</span>
          <input
            type="text"
            className="admin-input"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">State / province</span>
          <input
            type="text"
            className="admin-input"
            value={stateProvince}
            onChange={(event) => setStateProvince(event.target.value)}
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">Country</span>
          <input
            type="text"
            className="admin-input"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          />
        </label>

        <label className="admin-form-field">
          <span className="admin-label">Postal code</span>
          <input
            type="text"
            className="admin-input"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
          />
        </label>
      </div>

      <p className="login-support-copy">Last updated: {updatedLabel}</p>

      {error ? <p className="admin-form-error">{error}</p> : null}
      {success ? <p className="login-form-status login-form-status-success">{success}</p> : null}

      <div className="account-settings-actions">
        <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
