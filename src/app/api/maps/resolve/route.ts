import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const normalizedInput = url.trim();

    if (!normalizedInput) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const response = await fetch(normalizedInput, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      },
    });

    let finalUrl = response.url || normalizedInput;

    // Sometimes maps.app.goo.gl returns HTML that contains the real Google Maps URL.
    const contentType = response.headers.get("content-type") || "";
    if (
      (finalUrl.includes("maps.app.goo.gl") || finalUrl.includes("goo.gl")) &&
      contentType.includes("text/html")
    ) {
      const html = await response.text();

      const extractedGoogleMapsUrl =
        html.match(/https:\/\/www\.google\.com\/maps\/[^"'<> ]+/i)?.[0] ||
        html.match(/https:\/\/maps\.google\.com\/[^"'<> ]+/i)?.[0] ||
        html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)?.[1];

      if (extractedGoogleMapsUrl) {
        finalUrl = extractedGoogleMapsUrl;
      }
    }

    const embedUrl = toGoogleEmbedUrl(finalUrl);

    if (!embedUrl) {
      return NextResponse.json(
        { error: "Could not convert map link to an embeddable URL." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      resolvedUrl: finalUrl,
      embedUrl,
    });
  } catch (error) {
    console.error("POST /api/maps/resolve error:", error);

    return NextResponse.json(
      { error: "Failed to resolve map link" },
      { status: 500 }
    );
  }
}

function toGoogleEmbedUrl(input: string) {
  try {
    const trimmed = input.trim();
    if (!trimmed) return "";

    // Plain text fallback
    if (!trimmed.startsWith("http")) {
      return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
    }

    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    const pathname = decodeURIComponent(url.pathname);

    // Already embeddable
    if (pathname.includes("/maps/embed")) {
      return trimmed;
    }

    // Direct query/search param
    const q = url.searchParams.get("q") || url.searchParams.get("query");
    if (q) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }

    // /maps/place/Some+Place...
    const placeMatch = pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeMatch?.[1]) {
      const place = placeMatch[1].replace(/\+/g, " ");
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }

    // /place/Some+Place...
    const shortPlaceMatch = pathname.match(/\/place\/([^/]+)/i);
    if (shortPlaceMatch?.[1]) {
      const place = shortPlaceMatch[1].replace(/\+/g, " ");
      return `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    }

    // Generic Google Maps URL fallback
    if (
      hostname.includes("google.com") ||
      hostname.includes("maps.google.com") ||
      hostname.includes("goo.gl") ||
      hostname.includes("maps.app.goo.gl")
    ) {
      return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
    }

    return "";
  } catch {
    return "";
  }
}