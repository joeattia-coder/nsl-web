"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiCheck, FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";

type VenueRow = {
  id: string;
  venueName: string;
  address: string;
  city: string;
  stateProvince: string;
  country: string;
  phoneNumber: string;
  mapLink: string;
  showOnVenuesPage: boolean;
  isActive: boolean;
};

type VenuesTableProps = {
  venues: VenueRow[];
};

export default function VenuesTable({ venues }: VenuesTableProps) {
  const [search, setSearch] = useState("");
  const [venueToDelete, setVenueToDelete] = useState<VenueRow | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredVenues = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return venues;

    return venues.filter((venue) => {
      return (
        venue.venueName.toLowerCase().includes(term) ||
        venue.address.toLowerCase().includes(term) ||
        venue.city.toLowerCase().includes(term) ||
        venue.stateProvince.toLowerCase().includes(term) ||
        venue.country.toLowerCase().includes(term) ||
        venue.phoneNumber.toLowerCase().includes(term)
      );
    });
  }, [venues, search]);

  const openSingleDeleteModal = (venue: VenueRow) => {
    setActionError(null);
    setVenueToDelete(venue);
  };

  const closeSingleDeleteModal = () => {
    if (deletingSingle) return;
    setVenueToDelete(null);
  };

  const confirmSingleDelete = async () => {
    if (!venueToDelete) return;

    try {
      setDeletingSingle(true);
      setActionError(null);

      const res = await fetch(`/api/venues/${venueToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to delete venue.");
      }

      setVenueToDelete(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setActionError(
        err instanceof Error ? err.message : "Failed to delete venue."
      );
    } finally {
      setDeletingSingle(false);
    }
  };

  return (
    <>
      {actionError ? (
        <div className="admin-form-error" style={{ marginBottom: "14px" }}>
          {actionError}
        </div>
      ) : null}

      <div className="admin-players-toolbar">
        <div className="admin-players-toolbar-left">
          <input
            type="text"
            className="admin-search-input admin-players-search"
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-players-toolbar-right">
          <Link
            href="/admin/venues/new"
            className="admin-toolbar-button admin-toolbar-button-add"
          >
            <FiPlus />
            <span>Add Venue</span>
          </Link>
        </div>
      </div>

      <div className="admin-players-table-shell">
        <div className="admin-players-table-wrap">
          <table className="admin-table admin-players-table">
            <thead>
              <tr>
                <th>Venue Name</th>
                <th>Address</th>
                <th>City</th>
                <th>State / Province</th>
                <th>Country</th>
                <th>Phone</th>
                <th>Show</th>
                <th className="admin-players-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredVenues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-players-empty">
                    No venues found.
                  </td>
                </tr>
              ) : (
                filteredVenues.map((venue) => (
                  <tr key={venue.id}>
                    <td>
                      <span className="admin-venue-name-text">
                        {venue.venueName}
                      </span>
                    </td>

                    <td>{venue.address || "—"}</td>
                    <td>{venue.city || "—"}</td>
                    <td>{venue.stateProvince || "—"}</td>
                    <td>{venue.country || "—"}</td>
                    <td>{venue.phoneNumber || "—"}</td>

                    <td>
                      <div className="admin-venue-show-cell">
                        {venue.isActive && venue.showOnVenuesPage ? (
                          <span
                            className="admin-venue-show-icon admin-venue-show-icon-yes"
                            title="Shown"
                            aria-label="Shown"
                          >
                            <FiCheck />
                          </span>
                        ) : (
                          <span
                            className="admin-venue-show-icon admin-venue-show-icon-no"
                            title="Hidden"
                            aria-label="Hidden"
                          >
                            <FiX />
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="admin-player-row-actions">
                        <Link
                          href={`/admin/venues/${venue.id}/edit`}
                          className="admin-icon-action admin-icon-action-edit"
                          aria-label={`Edit ${venue.venueName}`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>

                        <button
                          type="button"
                          className="admin-icon-action admin-icon-action-delete"
                          aria-label={`Delete ${venue.venueName}`}
                          title="Delete"
                          onClick={() => openSingleDeleteModal(venue)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {venueToDelete && (
        <div
          className="admin-modal-backdrop"
          onClick={closeSingleDeleteModal}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="single-delete-title"
          >
            <h2 id="single-delete-title" className="admin-modal-title">
              Delete venue?
            </h2>

            <p className="admin-modal-text">
              You are about to delete <strong>{venueToDelete.venueName}</strong>.
              This action cannot be undone.
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={closeSingleDeleteModal}
                disabled={deletingSingle}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-modal-button admin-modal-button-delete"
                onClick={confirmSingleDelete}
                disabled={deletingSingle}
              >
                {deletingSingle ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}