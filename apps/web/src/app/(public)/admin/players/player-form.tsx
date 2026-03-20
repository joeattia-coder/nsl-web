"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { FiArrowLeft, FiImage, FiMail, FiSave, FiScissors, FiUpload, FiUserPlus, FiX } from "react-icons/fi";
import { blobToFile, cropAndResizeToWebP, dataUrlToFile } from "@/lib/image-processing";

type PlayerFormMode = "create" | "edit";

type Player = {
  id: string;
  userId?: string | null;
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
  const [sendingInvite, setSendingInvite] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

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
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const handleCropAreaComplete = useCallback(
    (_croppedArea: Area, croppedPixels: Area) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

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
        setLinkedUserId(player.userId ?? null);
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
    setIsCropEditorOpen(false);
    setPhotoFile(file);
  }

  function handleRemovePhoto() {
    setError(null);
    setPhotoFile(null);
    setPhotoPreviewUrl("");
    setPhotoUrl("");
    setIsCropEditorOpen(false);
    setCroppedAreaPixels(null);
    setZoom(1);

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

  function handleOpenCropEditor() {
    if (!previewImage) {
      setError("Upload a photo before cropping.");
      return;
    }

    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropEditorOpen(true);
  }

  async function handleApplyCrop() {
    if (!previewImage || !croppedAreaPixels) {
      setError("Adjust the crop area before applying.");
      return;
    }

    setIsCropping(true);
    setError(null);

    try {
      const processedBlob = await cropAndResizeToWebP(previewImage, croppedAreaPixels, 600);
      const processedFile = blobToFile(processedBlob, `player-photo-${Date.now()}.webp`);

      setPhotoFile(processedFile);
      setIsCropEditorOpen(false);
      setCroppedAreaPixels(null);
    } catch (cropError) {
      console.error(cropError);
      setError(cropError instanceof Error ? cropError.message : "Failed to crop photo.");
    } finally {
      setIsCropping(false);
    }
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
      setSuccess(null);
      setInviteLink(null);

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

  async function handleSendInvite() {
    if (!isEdit || !playerId) {
      return;
    }

    try {
      setSendingInvite(true);
      setError(null);
      setSuccess(null);
      setInviteLink(null);

      const response = await fetch(`/api/admin/players/${playerId}/invite`, {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; details?: string; message?: string; inviteLink?: string | null }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.details || payload?.error || "Failed to send invitation."
        );
      }

      setSuccess(payload?.message || "Invitation sent.");
      setInviteLink(payload?.inviteLink ?? null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setSendingInvite(false);
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
          {success ? (
            <p className="login-form-status login-form-status-success">{success}</p>
          ) : null}
          {inviteLink ? (
            <p className="login-form-status login-form-status-info">
              Development invite link: <a href={inviteLink}>{inviteLink}</a>
            </p>
          ) : null}

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
                disabled={isRemovingBackground || isCropEditorOpen || isCropping}
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
                    onClick={handleOpenCropEditor}
                    disabled={isRemovingBackground || saving || uploadingPhoto || isCropping}
                    className="admin-player-form-button admin-player-form-button-secondary"
                  >
                    <FiScissors />
                    <span>{isCropEditorOpen ? "Cropper Open" : "Crop Photo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isRemovingBackground || saving || uploadingPhoto || isCropping}
                    className="admin-player-form-button admin-player-form-button-danger"
                  >
                    <FiX />
                    <span>{photoFile ? "Remove Selected Photo" : "Remove Photo"}</span>
                  </button>
                </div>
              ) : null}

              {previewImage && isCropEditorOpen ? (
                <div className="admin-player-crop-panel">
                  <p className="admin-player-crop-title">Crop Player Photo</p>
                  <div className="admin-player-cropper-wrap">
                    <Cropper
                      image={previewImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid
                      restrictPosition
                      onCropChange={setCrop}
                      onCropComplete={handleCropAreaComplete}
                      onZoomChange={setZoom}
                    />
                  </div>

                  <div className="admin-player-crop-controls">
                    <label htmlFor="playerCropZoom" className="admin-player-crop-zoom-label">
                      Zoom
                    </label>
                    <input
                      id="playerCropZoom"
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(event) => setZoom(Number.parseFloat(event.target.value))}
                      className="admin-player-crop-slider"
                    />
                  </div>

                  <div className="admin-player-crop-actions">
                    <button
                      type="button"
                      onClick={() => setIsCropEditorOpen(false)}
                      className="admin-player-form-button admin-player-form-button-secondary"
                      disabled={isCropping}
                    >
                      Cancel Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleApplyCrop()}
                      className="admin-player-form-button admin-player-form-button-primary"
                      disabled={isCropping || !croppedAreaPixels}
                    >
                      {isCropping ? "Applying Crop..." : "Apply Crop"}
                    </button>
                  </div>
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

            {isEdit ? (
              <button
                type="button"
                className="admin-player-form-button admin-player-form-button-secondary"
                onClick={() => void handleSendInvite()}
                disabled={
                  sendingInvite ||
                  saving ||
                  uploadingPhoto ||
                  isRemovingBackground ||
                  !emailAddress.trim()
                }
                title={
                  emailAddress.trim()
                    ? linkedUserId
                      ? "Send invite to existing linked user"
                      : "Send invite and create a user account on acceptance"
                    : "Add an email address before sending invite"
                }
              >
                <FiMail />
                <span>{sendingInvite ? "Sending Invite..." : "Send Invite"}</span>
              </button>
            ) : null}

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