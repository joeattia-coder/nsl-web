import sanitizeHtmlLib from "sanitize-html";

export const NEWS_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export const HOME_NEWS_PLACEMENTS = ["SCROLLING_BANNER", "NEWS_SECTION"] as const;
export const HOME_NEWS_DISPLAY_MODES = [
  "THUMBNAIL",
  "TITLE",
  "THUMBNAIL_TITLE",
] as const;

export type NewsStatusValue = (typeof NEWS_STATUSES)[number];
export type HomeNewsPlacementValue = (typeof HOME_NEWS_PLACEMENTS)[number];
export type HomeNewsDisplayModeValue = (typeof HOME_NEWS_DISPLAY_MODES)[number];

export function slugifyNewsTitle(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function sanitizeNewsHtml(html: string) {
  return sanitizeHtmlLib(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "h2",
      "h3",
      "h4",
      "a",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    transformTags: {
      a: sanitizeHtmlLib.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank",
      }),
    },
  });
}

export function parseOptionalString(value: unknown) {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed ? parsed : null;
}

export function parseNewsStatus(value: unknown): NewsStatusValue {
  return NEWS_STATUSES.includes(value as NewsStatusValue)
    ? (value as NewsStatusValue)
    : "DRAFT";
}

export function parseHomePlacement(value: unknown): HomeNewsPlacementValue | null {
  return HOME_NEWS_PLACEMENTS.includes(value as HomeNewsPlacementValue)
    ? (value as HomeNewsPlacementValue)
    : null;
}

export function parseHomeDisplayMode(value: unknown): HomeNewsDisplayModeValue | null {
  return HOME_NEWS_DISPLAY_MODES.includes(value as HomeNewsDisplayModeValue)
    ? (value as HomeNewsDisplayModeValue)
    : null;
}

export function parseHomeSortOrder(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}
