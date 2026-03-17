"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiImage, FiSave, FiScissors, FiUpload, FiUserPlus, FiX } from "react-icons/fi";
import { PhotoCropModal } from "./PhotoCropModal";
import { dataUrlToFile } from "@/lib/image-processing";

type PlayerFormMode = "create" | "edit";

type Player = {
  id: string;
  firstName?: string | null;
  middleInitial?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  postalCode?: string | null;
  photoUrl?: string | null;
};

type PlayerFormProps = {
  mode: PlayerFormMode;
  playerId?: string;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

export default function PlayerForm({
  mode,
  playerId,
}: PlayerFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // Crop modal state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  useEffect(() => {
    if (!isEdit || !playerId) return;

    async function loadPlayer() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/players/${playerId}`, {
          cache: "no-store",
        });

        const data: Player | { error?: string; details?: string } | null =
          await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            (data as { details?: string; error?: string } | null)?.details ||
            (data as { error?: string } | null)?.error ||
            "Failed to fetch player.";
          throw new Error(message);
        }

        const player = data as Player;

        setFirstName(player.firstName ?? "");
        setMiddleInitial(player.middleInitial ?? "");
        setLastName(player.lastName ?? "");
        setDateOfBirth(
          player.dateOfBirth ? String(player.dateOfBirth).slice(0, 10) : ""
        );
        setEmailAddress(player.emailAddress ?? "");
        setPhoneNumber(player.phoneNumber ?? "");
        setAddressLine1(player.addressLine1 ?? "");
        setAddressLine2(player.addressLine2 ?? "");
        setCity(player.city ?? "");
        setStateProvince(player.stateProvince ?? "");
        setCountry(player.country ?? "");
        setPostalCode(player.postalCode ?? "");
        setPhotoUrl(player.photoUrl ?? "");
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load player.");
      } finally {
        setLoading(false);
      }
    }

    void loadPlayer();
  }, [isEdit, playerId]);

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
    if (photoPreviewUrl) return photoPreviewUrl;
    return photoUrl.trim() || "";
  }, [photoPreviewUrl, photoUrl]);

  const hasSelectedPhoto = Boolean(photoFile);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setPhotoFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, and WebP files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Photo is too large. Maximum size is 4 MB.");
      e.target.value = "";
      return;
    }

    setError(null);
    setIsCropModalOpen(false);
    setPhotoFile(file);
  }

  function handleRemovePhoto() {
    setError(null);
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    setPhotoUrl("");
    setIsCropModalOpen(false);

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  async function handleRemoveBackground() {
    if (!photoFile) return;

    const formData = new FormData();
    formData.append("file", photoFile);

    setIsRemovingBackground(true);
    setError(null);

    try {
      const res = await fetch("/api/uploads/remove-background", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to remove background from image."
        );
      }

      const extension = data?.mimeType === "image/png" ? "png" : "webp";
      const processedFile = await dataUrlToFile(
        data.dataUrl,
        `player-photo-${Date.now()}-no-bg.${extension}`
      );

      setPhotoFile(processedFile);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process image. Please try again."
      );
    } finally {
      setIsRemovingBackground(false);
    }
  }

  function handleOpenCropModal() {
    if (!previewImage) {
      setError("Upload a photo before cropping.");
      return;
    }

    setError(null);
    setIsCropModalOpen(true);
  }

  async function handleCropComplete(processedFile: File) {
    // Update the photo file with the cropped, resized, WebP version.
    setPhotoFile(processedFile);
    setError(null);
  }

  async function uploadPhotoIfNeeded() {
    if (!photoFile) {
      return photoUrl.trim() || null;
    }

    const formData = new FormData();
    formData.append("file", photoFile);

    setUploadingPhoto(true);

    try {
      const res = await fetch("/api/uploads/player-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to upload photo.");
      }

      return data.url as string;
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const uploadedPhotoUrl = await uploadPhotoIfNeeded();

      const payload = {
        firstName: firstName.trim(),
        middleInitial: middleInitial.trim().toUpperCase() || null,
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || null,
        emailAddress: emailAddress.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        addressLine1: addressLine1.trim() || null,
        addressLine2: addressLine2.trim() || null,
        city: city.trim() || null,
        stateProvince: stateProvince.trim() || null,
        country: country.trim() || null,
        postalCode: postalCode.trim() || null,
        photoUrl: uploadedPhotoUrl,
      };

      const res = await fetch(
        isEdit ? `/api/players/${playerId}` : "/api/players",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            (isEdit ? "Failed to update player." : "Failed to create player.")
        );
      }

      router.push("/admin/players");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update player."
            : "Failed to create player."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          <p>Loading player...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PhotoCropModal
        imageDataUrl={previewImage}
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        onConfirm={handleCropComplete}
      />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEdit ? "Edit Player" : "Add Player"}
          </h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update player details, contact information, and profile photo."
              : "Create a new player profile for the league."}
          </p>
        </div>

        <Link
          href="/admin/players"
          className="admin-player-form-button admin-player-form-button-secondary"
        >
          <FiArrowLeft />
          <span>Back to Players</span>
        </Link>
      </div>

      <div className="admin-card admin-player-form-card">
        <form onSubmit={handleSubmit} className="admin-form">
          {error ? <p className="admin-form-error">{error}</p> : null}

          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label htmlFor="firstName" className="admin-label">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="admin-input admin-player-form-input"
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="middleInitial" className="admin-label">
                Middle Initial
              </label>
              <input
                id="middleInitial"
                type="text"
                value={middleInitial}
                onChange={(e) => setMiddleInitial(e.target.value)}
                className="admin-input admin-player-form-input"
                maxLength={1}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="lastName" className="admin-label">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="admin-input admin-player-form-input"
                required
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="dateOfBirth" className="admin-label">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="emailAddress" className="admin-label">
                Email Address
              </label>
              <input
                id="emailAddress"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="phoneNumber" className="admin-label">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="photoFile" className="admin-label">
                Player Photo
              </label>

              <label
                htmlFor="photoFile"
                className="admin-player-form-button admin-player-form-button-secondary admin-player-upload-trigger"
              >
                <FiUpload />
                <span>{photoFile ? "Change Photo" : "Upload Photo"}</span>
              </label>

              <input
                ref={photoInputRef}
                id="photoFile"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="admin-player-file-input"
                disabled={isRemovingBackground || isCropModalOpen}
              />

              <p className="admin-player-file-help">
                JPG, PNG, or WebP. Maximum size: 4 MB. Upload first, then optionally remove the background or crop the photo.
              </p>

              {previewImage ? (
                <div className="admin-player-photo-preview">
                  <Image
                    src={previewImage}
                    alt="Player photo preview"
                    width={88}
                    height={88}
                    className="admin-player-photo-preview-img"
                    unoptimized
                  />

                  {hasSelectedPhoto ? (
                    <button
                      type="button"
                      onClick={handleRemoveBackground}
                      disabled={isRemovingBackground || saving || uploadingPhoto}
                      className="admin-player-form-button admin-player-form-button-secondary"
                    >
                      <FiImage />
                      <span>
                        {isRemovingBackground ? "Removing Background..." : "Remove Background"}
                      </span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleOpenCropModal}
                    disabled={isRemovingBackground || saving || uploadingPhoto}
                    className="admin-player-form-button admin-player-form-button-secondary"
                  >
                    <FiScissors />
                    <span>Crop Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isRemovingBackground || saving || uploadingPhoto}
                    className="admin-player-form-button admin-player-form-button-danger"
                  >
                    <FiX />
                    <span>{photoFile ? "Remove Selected Photo" : "Remove Photo"}</span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="addressLine1" className="admin-label">
                Address Line 1
              </label>
              <input
                id="addressLine1"
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="addressLine2" className="admin-label">
                Address Line 2
              </label>
              <input
                id="addressLine2"
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="city" className="admin-label">
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="stateProvince" className="admin-label">
                State / Province
              </label>
              <input
                id="stateProvince"
                type="text"
                value={stateProvince}
                onChange={(e) => setStateProvince(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="country" className="admin-label">
                Country
              </label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="postalCode" className="admin-label">
                Postal Code
              </label>
              <input
                id="postalCode"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="admin-input admin-player-form-input"
              />
            </div>
          </div>

          <div className="admin-form-actions admin-player-form-actions">
            <Link
              href="/admin/players"
              className="admin-player-form-button admin-player-form-button-secondary"
            >
              <FiX />
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              className={`admin-player-form-button ${
                isEdit
                  ? "admin-player-form-button-primary"
                  : "admin-player-form-button-create"
              }`}
              disabled={saving || uploadingPhoto || isRemovingBackground}
            >
              {isEdit ? <FiSave /> : <FiUserPlus />}
              <span>
                {isRemovingBackground
                  ? "Removing Background..."
                  : uploadingPhoto
                    ? "Uploading Photo..."
                    : saving
                      ? isEdit
                        ? "Saving..."
                        : "Creating..."
                      : isEdit
                        ? "Save Changes"
                        : "Save Player"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}