import { Prisma } from "@/generated/prisma/client";
import sanitizeHtmlLib from "sanitize-html";

export function sanitizeTermsHtml(html: string) {
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

export function parseOptionalTermsText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseTermsPublishedAt(value: unknown) {
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

export const DEFAULT_TERMS_TITLE = "Terms of Service";

export const DEFAULT_TERMS_CONTENT_HTML =
  "<p>The National Snooker League Terms of Service will be published here soon.</p>";

export function isTermsTableMissingError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2021") {
    return false;
  }

  return `${error.message} ${JSON.stringify(error.meta ?? {})}`.includes("TermsOfServiceVersion");
}