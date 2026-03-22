import { Prisma } from "@/generated/prisma/client";
import sanitizeHtmlLib from "sanitize-html";

export function sanitizeAboutHtml(html: string) {
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

export function parseOptionalAboutText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseAboutPublishedAt(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return new Date();
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

export const DEFAULT_ABOUT_TITLE = "The National Snooker League";

export const DEFAULT_ABOUT_SUBTITLE =
  "Building a stronger home for league play and regular competitive snooker events across North America.";

export const DEFAULT_ABOUT_CONTENT_HTML =
  "<p>Launched in 2026, The National Snooker League (NSL) is premier snooker brand in North America for snooker league play and regular competitive events.</p>";

export function isAboutTableMissingError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2021") {
    return false;
  }

  return `${error.message} ${JSON.stringify(error.meta ?? {})}`.includes("AboutSectionVersion");
}