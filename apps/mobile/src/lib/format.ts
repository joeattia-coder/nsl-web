import type { PublicFixture } from "@nsl/shared";

export function formatPublishedDate(value: string | null) {
  if (!value) return "Published article";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMatchDateTime(isoDateTime: string, fallbackTime?: string | null) {
  if (!isoDateTime) {
    return fallbackTime?.trim() || "Time to be confirmed";
  }

  const date = new Date(isoDateTime);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatScoreLine(fixture: PublicFixture) {
  if (fixture.homeScore == null || fixture.roadScore == null) {
    return "Score pending";
  }

  return `${fixture.homeScore} - ${fixture.roadScore}`;
}

export function formatFixtureStatus(fixture: PublicFixture) {
  const schedule = fixture.scheduleStatus?.replaceAll("_", " ").toLowerCase();
  const match = fixture.matchStatus?.replaceAll("_", " ").toLowerCase();

  if (match) {
    return match.replace(/^./, (character) => character.toUpperCase());
  }

  if (schedule) {
    return schedule.replace(/^./, (character) => character.toUpperCase());
  }

  return "Scheduled";
}

export function formatPublishedDateLong(value: string | null) {
  if (!value) return "Publication date pending";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}