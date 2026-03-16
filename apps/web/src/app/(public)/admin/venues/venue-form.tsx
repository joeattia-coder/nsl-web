"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiImage, FiMap, FiPlus, FiSave, FiUpload, FiX } from "react-icons/fi";

type VenueFormMode = "create" | "edit";

type Venue = {
  id: string;
  venueName?: string | null;
  logoUrl?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
  mapLink?: string | null;
  showOnVenuesPage?: boolean | null;
  isActive?: boolean | null;
};

type VenueFormProps = {
  mode: VenueFormMode;
  venueId?: string;
};

export default function VenueForm({ mode, venueId }: VenueFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [venueName, setVenueName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateProvince, setStateProvince] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [showOnVenuesPage, setShowOnVenuesPage] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [embedSrc, setEmbedSrc] = useState("");
  const [resolvingMap, setResolvingMap] = useState(false);

  useEffect(() => {
    if (!isEdit || !venueId) return;

    async function loadVenue() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/venues/${venueId}`, {
          cache: "no-store",
        });

        const data: Venue | { error?: string; details?: string } | null =
          await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            (data as { details?: string; error?: string } | null)?.details ||
            (data as { error?: string } | null)?.error ||
            "Failed to fetch venue.";
          throw new Error(message);
        }

        const venue = data as Venue;

        setVenueName(venue.venueName ?? "");
  setLogoUrl(venue.logoUrl ?? "");
        setAddressLine1(venue.addressLine1 ?? "");
        setAddressLine2(venue.addressLine2 ?? "");
        setCity(venue.city ?? "");
        setStateProvince(venue.stateProvince ?? "");
        setCountry(venue.country ?? "");
        setPostalCode(venue.postalCode ?? "");
        setPhoneNumber(venue.phoneNumber ?? "");
        setMapLink(venue.mapLink ?? "");
        setShowOnVenuesPage(venue.showOnVenuesPage ?? true);
        setIsActive(venue.isActive ?? true);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load venue.");
      } finally {
        setLoading(false);
      }
    }

    void loadVenue();
  }, [isEdit, venueId]);

  const locationQuery = useMemo(() => {
    return [venueName, addressLine1, city, stateProvince, country]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(", ");
  }, [venueName, addressLine1, city, stateProvince, country]);

  useEffect(() => {
    let cancelled = false;

    async function resolveMapPreview() {
      const trimmedMapLink = mapLink.trim();
      const trimmedLocationQuery = locationQuery.trim();

      // Nothing entered anywhere
      if (!trimmedMapLink && !trimmedLocationQuery) {
        if (!cancelled) {
          setEmbedSrc("");
          setResolvingMap(false);
        }
        return;
      }

      // Manual override via mapLink takes priority
      if (trimmedMapLink) {
        // Plain text entered into mapLink
        if (!trimmedMapLink.startsWith("http")) {
          if (!cancelled) {
            setEmbedSrc(
              `https://www.google.com/maps?q=${encodeURIComponent(trimmedMapLink)}&output=embed`
            );
            setResolvingMap(false);
          }
          return;
        }

        try {
          const url = new URL(trimmedMapLink);
          const host = url.hostname.toLowerCase();

          // Already an embed URL
          if (url.pathname.includes("/maps/embed")) {
            if (!cancelled) {
              setEmbedSrc(trimmedMapLink);
              setResolvingMap(false);
            }
            return;
          }

          // Resolve Google/short links through server
          if (
            host.includes("maps.app.goo.gl") ||
            host.includes("goo.gl") ||
            host.includes("google.com")
          ) {
            if (!cancelled) {
              setResolvingMap(true);
            }

            const res = await fetch("/api/maps/resolve", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ url: trimmedMapLink }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
              throw new Error(data?.error || "Failed to resolve map link.");
            }

            if (!cancelled) {
              setEmbedSrc(data?.embedUrl || "");
              setResolvingMap(false);
            }
            return;
          }

          if (!cancelled) {
            setEmbedSrc("");
            setResolvingMap(false);
          }
          return;
        } catch {
          if (!cancelled) {
            setEmbedSrc("");
            setResolvingMap(false);
          }
          return;
        }
      }

      // Fallback: auto-preview from venue fields
      if (!cancelled) {
        setEmbedSrc(
          `https://www.google.com/maps?q=${encodeURIComponent(trimmedLocationQuery)}&output=embed`
        );
        setResolvingMap(false);
      }
    }

    void resolveMapPreview();

    return () => {
      cancelled = true;
    };
  }, [mapLink, locationQuery]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const payload = {
        venueName: venueName.trim(),
        logoUrl: logoUrl.trim() || null,
        addressLine1: addressLine1.trim() || null,
        addressLine2: addressLine2.trim() || null,
        city: city.trim() || null,
        stateProvince: stateProvince.trim() || null,
        country: country.trim() || null,
        postalCode: postalCode.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        mapLink: mapLink.trim() || null,
        showOnVenuesPage,
        isActive,
      };

      const res = await fetch(
        isEdit ? `/api/venues/${venueId}` : "/api/venues",
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
            (isEdit ? "Failed to update venue." : "Failed to create venue.")
        );
      }

      router.push("/admin/venues");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update venue."
            : "Failed to create venue."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploadingLogo(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/venue-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to upload venue logo.");
      }

      setLogoUrl(data?.url || "");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to upload venue logo."
      );
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-player-form-card">
          <p>Loading venue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            {isEdit ? "Edit Venue" : "Add Venue"}
          </h1>
          <p className="admin-page-subtitle">
            {isEdit
              ? "Update venue details, location information, and visibility."
              : "Create a new venue for tournaments and matches."}
          </p>
        </div>

        <Link
          href="/admin/venues"
          className="admin-player-form-button admin-player-form-button-secondary"
        >
          <FiArrowLeft />
          <span>Back to Venues</span>
        </Link>
      </div>

      <div className="admin-venue-form-layout">
        <div className="admin-card admin-player-form-card admin-venue-form-card-left">
          <form onSubmit={handleSubmit} className="admin-form">
            {error ? <p className="admin-form-error">{error}</p> : null}

            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-full">
                <label htmlFor="venueName" className="admin-label">
                  Venue Name
                </label>
                <input
                  id="venueName"
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="admin-input admin-player-form-input"
                  required
                />
              </div>

              <div className="admin-form-field admin-form-field-full">
                <label className="admin-label">Venue Logo</label>
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <button
                    type="button"
                    className="admin-player-form-button admin-player-form-button-secondary"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <FiUpload />
                    <span>{uploadingLogo ? "Uploading..." : "Upload Venue Logo"}</span>
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="admin-player-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleLogoUpload(file);
                      }
                    }}
                  />
                  <input type="hidden" value={logoUrl} readOnly />
                  <div className="text-sm text-slate-500">
                    {logoUrl
                      ? "Venue logo uploaded and ready for homepage or venue listings."
                      : "Upload a venue logo to use in admin and public displays."}
                  </div>
                </div>

                {logoUrl ? (
                  <div className="admin-player-photo-preview admin-venue-logo-preview">
                    <Image
                      src={logoUrl}
                      alt="Venue logo preview"
                      width={96}
                      height={96}
                      className="admin-player-photo-preview-img"
                    />
                  </div>
                ) : (
                  <div className="admin-venue-logo-empty">
                    <FiImage />
                    <span>No logo uploaded yet</span>
                  </div>
                )}
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

              <div className="admin-form-field">
                <label htmlFor="mapLink" className="admin-label">
                  Override Map Link
                </label>
                <input
                  id="mapLink"
                  type="text"
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  className="admin-input admin-player-form-input"
                  placeholder="Optional: paste a Google Maps link or short share link"
                />
                <p className="admin-venue-map-help">
                  The preview uses the venue name and address automatically. If
                  the location is incorrect, paste a Google Maps link or short
                  share link here to override it.
                </p>
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Show On Venues Page</label>
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={showOnVenuesPage}
                    onChange={(e) => setShowOnVenuesPage(e.target.checked)}
                  />
                  <span>Visible on public venues page</span>
                </label>
              </div>

              <div className="admin-form-field">
                <label className="admin-label">Venue Status</label>
                <label className="admin-checkbox-inline">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Venue is active</span>
                </label>
              </div>
            </div>

            <div className="admin-form-actions admin-player-form-actions">
              <Link
                href="/admin/venues"
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
                disabled={saving}
              >
                {isEdit ? <FiSave /> : <FiPlus />}
                <span>
                  {saving
                    ? isEdit
                      ? "Saving..."
                      : "Creating..."
                    : isEdit
                      ? "Save Changes"
                      : "Save Venue"}
                </span>
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card admin-player-form-card admin-venue-map-card">
          <div className="admin-venue-map-header">
            <div className="admin-venue-map-title-row">
              <span className="admin-venue-map-title-icon">
                <FiMap />
              </span>
              <div>
                <h2 className="admin-venue-map-title">Map Preview</h2>
                <p className="admin-venue-map-subtitle">
                  Preview updates automatically from the venue details. A map
                  link override takes priority when provided.
                </p>
              </div>
            </div>
          </div>

          {resolvingMap ? (
            <div className="admin-venue-map-empty">
              <div className="admin-venue-map-empty-inner">
                <span className="admin-venue-map-empty-icon">
                  <FiMap />
                </span>
                <p className="admin-venue-map-empty-title">
                  Resolving map link...
                </p>
                <p className="admin-venue-map-empty-text">
                  Please wait while the Google Maps link is being processed.
                </p>
              </div>
            </div>
          ) : embedSrc ? (
            <div className="admin-venue-map-frame-wrap">
              <iframe
                src={embedSrc}
                className="admin-venue-map-frame"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                title="Venue map preview"
              />
            </div>
          ) : (
            <div className="admin-venue-map-empty">
              <div className="admin-venue-map-empty-inner">
                <span className="admin-venue-map-empty-icon">
                  <FiMap />
                </span>
                <p className="admin-venue-map-empty-title">
                  Enter venue details
                </p>
                <p className="admin-venue-map-empty-text">
                  Start typing the venue name or address to preview the location
                  here. If the map is incorrect, paste a Google Maps link in the
                  override field.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}