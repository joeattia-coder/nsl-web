"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { setAdminFlashMessage } from "@/lib/admin-flash";
import { FiSave, FiX } from "react-icons/fi";

type EntryOption = {
  id: string;
  label: string;
  disabled: boolean;
};

type ManageGroupFormProps = {
  tournamentId: string;
  stageId: string;
  roundId: string;
  groupId: string;
  groupName: string;
  playersPerGroup?: number;
  entryOptions?: EntryOption[];
  initialEntryIds?: string[];
};

export default function ManageGroupForm({
  tournamentId,
  stageId,
  roundId,
  groupId,
  groupName,
  playersPerGroup = 0,
  entryOptions = [],
  initialEntryIds = [],
}: ManageGroupFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const slotCount =
    typeof playersPerGroup === "number" && playersPerGroup > 0
      ? playersPerGroup
      : initialEntryIds.length > 0
        ? initialEntryIds.length
        : 4;

  const [slots, setSlots] = useState<string[]>(
    Array.from({ length: slotCount }, (_, index) => initialEntryIds[index] ?? "")
  );

  const selectedIds = useMemo(() => slots.filter(Boolean), [slots]);

  function updateSlot(index: number, value: string) {
    setSlots((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const chosen = slots.filter(Boolean);

    if (new Set(chosen).size !== chosen.length) {
      setFeedbackModal({
        title: "Duplicate entry selected",
        message: "The same entry cannot be selected more than once in this group.",
      });
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`/api/tournaments/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryIds: chosen,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to save group assignments."
        );
      }

      setAdminFlashMessage(`round-groups:${roundId}`, {
        title: "Save Group Assignments Complete",
        message: `Assignments for ${groupName} were saved successfully.`,
      });
      router.push(
        `/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}/groups`
      );
      router.refresh();
    } catch (err) {
      console.error(err);
      setFeedbackModal({
        title: "Could not save assignments",
        message:
          err instanceof Error ? err.message : "Failed to save group assignments.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card admin-player-form-card">
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-field admin-form-field-full">
          <label className="admin-label">{groupName}</label>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginTop: "8px",
            }}
          >
            {slots.map((value, index) => {
              const selectedOption = entryOptions.find(
                (option) => option.id === value
              );

              return (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px minmax(0, 1fr)",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Slot {index + 1}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <select
                      value={value}
                      onChange={(e) => updateSlot(index, e.target.value)}
                      className="admin-select admin-player-form-input"
                    >
                      <option value="">Bye</option>
                      {entryOptions.map((option) => {
                        const isSelectedInCurrentSlot = value === option.id;
                        const isSelectedElsewhereInThisForm =
                          selectedIds.includes(option.id) && !isSelectedInCurrentSlot;

                        return (
                          <option
                            key={option.id}
                            value={option.id}
                            disabled={option.disabled || isSelectedElsewhereInThisForm}
                          >
                            {option.label}
                          </option>
                        );
                      })}
                    </select>

                    <span style={{ fontSize: "13px", color: "#6b7280" }}>
                      {value ? selectedOption?.label ?? "Selected entry" : "Bye"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-form-actions admin-player-form-actions">
          <Link
            href={`/admin/tournaments/${tournamentId}/stages/${stageId}/rounds/${roundId}/groups`}
            className="admin-player-form-button admin-player-form-button-secondary"
          >
            <FiX />
            <span>Cancel</span>
          </Link>

          <button
            type="submit"
            className="admin-player-form-button admin-player-form-button-primary"
            disabled={saving}
          >
            <FiSave />
            <span>{saving ? "Saving..." : "Save Assignments"}</span>
          </button>
        </div>
      </form>

      {feedbackModal ? (
        <div
          className="admin-modal-backdrop"
          onClick={() => setFeedbackModal(null)}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-group-feedback-title"
          >
            <h2 id="manage-group-feedback-title" className="admin-modal-title">
              {feedbackModal.title}
            </h2>

            <p className="admin-modal-text">{feedbackModal.message}</p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-button admin-modal-button-cancel"
                onClick={() => setFeedbackModal(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}