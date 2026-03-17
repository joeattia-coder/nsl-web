import sanitizeHtmlLib from "sanitize-html";

export function sanitizeFaqHtml(html: string) {
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

export function parseFaqSortOrder(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

export function parseFaqPublished(value: unknown) {
  return Boolean(value);
}
