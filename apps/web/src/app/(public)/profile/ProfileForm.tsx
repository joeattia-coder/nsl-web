"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiUpload, FiX } from "react-icons/fi";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(initialData.updatedAt);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const updatedLabel = useMemo(() => {
    return new Date(updatedAt).toLocaleString();
  }, [updatedAt]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  const previewImage = useMemo(() => {
    if (photoPreviewUrl) {
      return photoPreviewUrl;
    }

    return photoUrl.trim() || "";
  }, [photoPreviewUrl, photoUrl]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setPhotoFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WebP files are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Photo is too large. Maximum size is 4 MB.");
      event.target.value = "";
      return;
    }

    setError(null);
    setPhotoFile(file);
  }

  function handleRemovePhoto() {
    setError(null);
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    setPhotoUrl("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  async function uploadPhotoIfNeeded() {
    if (!photoFile) {
      return photoUrl.trim() || null;
    }

    const formData = new FormData();
    formData.append("file", photoFile);
    setIsUploadingPhoto(true);

    try {
      const response = await fetch("/api/uploads/player-photo", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; details?: string; url?: string }
        | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.details || payload?.error || "Failed to upload photo.");
      }

      return payload.url;
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const uploadedPhotoUrl = await uploadPhotoIfNeeded();

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
          photoUrl: uploadedPhotoUrl,
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
      setPhotoFile(null);

      if (uploadedPhotoUrl) {
        setPhotoUrl(uploadedPhotoUrl);
      }

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
          <span className="admin-label">Photo</span>

          <div className="admin-player-photo-preview">
            {previewImage ? (
              <Image
                src={previewImage}
                alt="Profile photo preview"
                width={88}
                height={88}
                className="admin-player-photo-preview-img"
                unoptimized
              />
            ) : null}

            <label
              htmlFor="profilePhotoFile"
              className="admin-player-form-button admin-player-form-button-secondary admin-player-upload-trigger"
            >
              <FiUpload />
              <span>{photoFile ? "Change Photo" : "Upload Photo"}</span>
            </label>

            <input
              ref={photoInputRef}
              id="profilePhotoFile"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="admin-player-file-input"
              disabled={isSubmitting || isUploadingPhoto}
            />

            {(photoFile || photoUrl.trim()) ? (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="admin-player-form-button admin-player-form-button-danger"
                disabled={isSubmitting || isUploadingPhoto}
              >
                <FiX />
                <span>{photoFile ? "Remove Selected Photo" : "Remove Photo"}</span>
              </button>
            ) : null}
          </div>

          <p className="admin-player-file-help">
            JPG, PNG, or WebP. Maximum size: 4 MB.
          </p>

          <input
            type="text"
            className="admin-input"
            value={photoUrl}
            onChange={(event) => setPhotoUrl(event.target.value)}
            placeholder="Or paste a photo URL"
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
        <button type="submit" className="admin-primary-button" disabled={isSubmitting || isUploadingPhoto}>
          {isUploadingPhoto ? "Uploading photo..." : isSubmitting ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
