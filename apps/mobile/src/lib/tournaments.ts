import type { MobileTournamentRecord } from "../types/api";
import type { TournamentSummary } from "../types/app";

function formatDateValue(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBC";
}

export function formatTournamentDateRange(startDate: string | null, endDate: string | null) {
  if (startDate && endDate) {
    return `${formatDateValue(startDate)} - ${formatDateValue(endDate)}`;
  }

  return formatDateValue(startDate || endDate);
}

export function formatTournamentStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function mapTournamentSummary(record: MobileTournamentRecord, isRegistered: boolean): TournamentSummary {
  return {
    id: record.id,
    name: record.tournamentName,
    division: record.seasonName || record.participantType,
    venue: record.venueName || "Venue TBC",
    dateLabel: formatTournamentDateRange(record.startDate, record.endDate),
    status: formatTournamentStatus(record.status),
    registrationNote: record.registrationDeadline
      ? `Registration deadline ${new Date(record.registrationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : isRegistered
        ? "You are registered"
        : "Registration status pending",
    shortDescription: record.description?.trim() || `${record.participantType} format${record.snookerFormat ? ` • ${record.snookerFormat.replace("REDS_", "")}-red` : ""}`,
    isRegistered,
    startDate: record.startDate,
    endDate: record.endDate,
    registrationDeadline: record.registrationDeadline,
    participantType: record.participantType,
    snookerFormat: record.snookerFormat,
  };
}