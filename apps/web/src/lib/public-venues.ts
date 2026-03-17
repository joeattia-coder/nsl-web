export type PublicVenue = {
  id: string;
  venueName: string;
  logoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  postalCode: string | null;
  phoneNumber: string | null;
  mapLink: string | null;
  showOnVenuesPage: boolean;
  isActive: boolean;
};

function cleanPart(value: string | null | undefined) {
  if (!value) return "";
  return value.trim();
}

export function getVenueAddressLines(venue: Pick<PublicVenue, "addressLine1" | "addressLine2" | "city" | "stateProvince" | "country" | "postalCode">) {
  const line1 = cleanPart(venue.addressLine1);
  const line2 = cleanPart(venue.addressLine2);
  const locality = [cleanPart(venue.city), cleanPart(venue.stateProvince)]
    .filter(Boolean)
    .join(", ");
  const countryPostal = [cleanPart(venue.country), cleanPart(venue.postalCode)]
    .filter(Boolean)
    .join(" ");

  return [line1, line2, locality, countryPostal].filter(Boolean);
}

export function getVenueAddressString(venue: Pick<PublicVenue, "addressLine1" | "addressLine2" | "city" | "stateProvince" | "country" | "postalCode">) {
  return getVenueAddressLines(venue).join(", ");
}

export function getVenueMapEmbedUrl(venue: Pick<PublicVenue, "mapLink" | "addressLine1" | "addressLine2" | "city" | "stateProvince" | "country" | "postalCode">) {
  const mapLink = cleanPart(venue.mapLink);

  if (mapLink) {
    const embedFromLink = toGoogleEmbedUrl(mapLink);
    if (embedFromLink) {
      return embedFromLink;
    }
  }

  const address = getVenueAddressString(venue);
  if (!address) return "";

  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function toGoogleEmbedUrl(input: string) {
  try {
    const trimmed = input.trim();
    if (!trimmed) return "";

    if (!trimmed.startsWith("http")) {
      return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
    }

    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    const pathname = decodeURIComponent(url.pathname);
    const q = url.searchParams.get("q") || url.searchParams.get("query");

    if (pathname.includes("/maps/embed")) {
      return trimmed;
    }

    if (q) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }

    const placeMatch = pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeMatch?.[1]) {
      return `https://www.google.com/maps?q=${encodeURIComponent(placeMatch[1].replace(/\+/g, " "))}&output=embed`;
    }

    const shortPlaceMatch = pathname.match(/\/place\/([^/]+)/i);
    if (shortPlaceMatch?.[1]) {
      return `https://www.google.com/maps?q=${encodeURIComponent(shortPlaceMatch[1].replace(/\+/g, " "))}&output=embed`;
    }

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
