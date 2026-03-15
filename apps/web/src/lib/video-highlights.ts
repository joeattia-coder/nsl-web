export const VIDEO_SOURCE_TYPES = ["YOUTUBE", "UPLOAD"] as const;

export type VideoSourceTypeValue = (typeof VIDEO_SOURCE_TYPES)[number];

export function parseVideoSourceType(value: unknown): VideoSourceTypeValue {
  return VIDEO_SOURCE_TYPES.includes(value as VideoSourceTypeValue)
    ? (value as VideoSourceTypeValue)
    : "YOUTUBE";
}

export function parseOptionalString(value: unknown) {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed ? parsed : null;
}

export function parseCarouselSortOrder(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

export function extractYouTubeVideoId(input: string) {
  const value = input.trim();
  if (!value) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      const candidate = segments[1] ?? "";
      if (["embed", "shorts", "live"].includes(segments[0] ?? "") && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
        return candidate;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeVideoUrl(sourceType: VideoSourceTypeValue, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (sourceType === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(trimmed);
    if (!videoId) {
      throw new Error("Enter a valid YouTube URL or video ID.");
    }

    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  return trimmed;
}

export function getVideoPresentation(sourceType: VideoSourceTypeValue, videoUrl: string) {
  if (sourceType === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      return {
        embedUrl: videoUrl,
        watchUrl: videoUrl,
      };
    }

    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  return {
    embedUrl: videoUrl,
    watchUrl: videoUrl,
  };
}

export async function resolveVideoTitle(sourceType: VideoSourceTypeValue, title: string, videoUrl: string) {
  const trimmedTitle = title.trim();
  if (trimmedTitle) return trimmedTitle;

  if (sourceType !== "YOUTUBE") {
    throw new Error("Title is required for uploaded videos.");
  }

  const normalizedUrl = normalizeVideoUrl(sourceType, videoUrl);
  const oembedUrl = new URL("https://www.youtube.com/oembed");
  oembedUrl.searchParams.set("url", normalizedUrl);
  oembedUrl.searchParams.set("format", "json");

  const response = await fetch(oembedUrl.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  const resolvedTitle = typeof data?.title === "string" ? data.title.trim() : "";

  if (!response.ok || !resolvedTitle) {
    throw new Error("Unable to fetch the default YouTube title. Enter a title manually or check the video link.");
  }

  return resolvedTitle;
}