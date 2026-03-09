"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

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
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function EditPlayerPage({ params }: PageProps) {
  const router = useRouter();

  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    async function loadPlayer() {
      try {
        setLoading(true);
        setError(null);

        const { id } = await params;
        setPlayerId(id);

        const res = await fetch(`/api/players/${id}`, {
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
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load player.");
      } finally {
        setLoading(false);
      }
    }

    void loadPlayer();
  }, [params]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/players/${playerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          middleInitial: middleInitial.trim() || null,
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
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to update player.");
      }

      router.push("/admin/players");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update player.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <p>Loading player...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Edit Player</h1>
          <p className="admin-page-subtitle">
            Update player details and contact information.
          </p>
        </div>

        <Link href="/admin/players" className="admin-link-button">
          Back to Players
        </Link>
      </div>

      <div className="admin-card">
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
              />
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
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
                className="admin-input"
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <Link href="/admin/players" className="admin-link-button">
              Cancel
            </Link>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}