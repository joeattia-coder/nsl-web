import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { publicApiJson, publicApiOptions } from "@/lib/public-api-response";

type PlayerLike = {
  firstName: string;
  lastName: string;
  country?: string | null;
  photoUrl?: string | null;
};

type EntryMemberLike = {
  player: PlayerLike;
};

type EntryLike = {
  entryName: string | null;
  members: EntryMemberLike[];
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function OPTIONS() {
  return publicApiOptions();
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toIsoDateTime(date: Date | null, matchTime?: string | null) {
  if (!date) return "";

  const nextDate = new Date(date);

  if (matchTime && /^\d{1,2}:\d{2}$/.test(matchTime.trim())) {
    const [hours, minutes] = matchTime.trim().split(":");
    nextDate.setHours(Number(hours), Number(minutes), 0, 0);
  }

  return nextDate.toISOString();
}

function toTimeString(date: Date | null, matchTime?: string | null) {
  if (matchTime?.trim()) return matchTime.trim();
  if (!date) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function getEntryDisplayName(entry: EntryLike | null | undefined) {
  if (!entry) return "TBD";

  if (entry.entryName?.trim()) return entry.entryName.trim();

  const names = entry.members
    .map((member) => {
      const first = member.player.firstName?.trim() ?? "";
      const last = member.player.lastName?.trim() ?? "";
      return `${first} ${last}`.trim();
    })
    .filter(Boolean);

  if (names.length === 0) return "TBD";
  if (names.length === 1) return names[0];

  return names.join(" / ");
}

function normalizeCountryCode(country: string) {
  const normalized = country.trim();

  if (!normalized) return "";

  if (/^[a-zA-Z]{2}$/.test(normalized)) {
    return normalized.toUpperCase();
  }

  const countryToCode: Record<string, string> = {
    canada: "CA",
    "united states": "US",
    usa: "US",
    us: "US",
    mexico: "MX",
    england: "GB",
    scotland: "GB",
    wales: "GB",
    "united kingdom": "GB",
    uk: "GB",
    ireland: "IE",
    france: "FR",
    germany: "DE",
    italy: "IT",
    spain: "ES",
    portugal: "PT",
    netherlands: "NL",
    belgium: "BE",
    switzerland: "CH",
    austria: "AT",
    sweden: "SE",
    norway: "NO",
    denmark: "DK",
    finland: "FI",
    poland: "PL",
    czechia: "CZ",
    "czech republic": "CZ",
    slovakia: "SK",
    hungary: "HU",
    romania: "RO",
    bulgaria: "BG",
    greece: "GR",
    turkey: "TR",
    cyprus: "CY",
    india: "IN",
    pakistan: "PK",
    china: "CN",
    japan: "JP",
    "south korea": "KR",
    korea: "KR",
    taiwan: "TW",
    thailand: "TH",
    vietnam: "VN",
    philippines: "PH",
    malaysia: "MY",
    singapore: "SG",
    indonesia: "ID",
    australia: "AU",
    "new zealand": "NZ",
    egypt: "EG",
    morocco: "MA",
    tunisia: "TN",
    "south africa": "ZA",
    nigeria: "NG",
    kenya: "KE",
    brazil: "BR",
    argentina: "AR",
    chile: "CL",
    colombia: "CO",
    peru: "PE",
    uruguay: "UY",
  };

  return countryToCode[normalized.toLowerCase()] || "";
}

function getEntryCountryCode(entry: EntryLike | null | undefined) {
  if (!entry) return "";

  const codes = Array.from(
    new Set(
      entry.members
        .map((member) => normalizeCountryCode(member.player.country ?? ""))
        .filter(Boolean)
    )
  );

  if (codes.length === 1) return codes[0];
  return "";
}

function getEntryPhotoUrl(entry: EntryLike | null | undefined) {
  if (!entry) return null;

  return (
    entry.members
      .map((member) => member.player.photoUrl?.trim() ?? "")
      .find(Boolean) || null
  );
}

function buildVenueSummary(match: {
  venue: {
    venueName: string;
    addressLine1: string | null;
    city: string | null;
    stateProvince: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
}) {
  if (!match.venue) return null;

  const parts = [
    match.venue.addressLine1,
    match.venue.city,
    match.venue.stateProvince,
    match.venue.postalCode,
    match.venue.country,
  ].filter(Boolean);

  return {
    name: match.venue.venueName,
    summary: parts.length ? parts.join(", ") : match.venue.venueName,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const match = await prisma.match.findFirst({
      where: {
        id,
        tournament: {
          isPublished: true,
        },
      },
      select: {
        id: true,
        matchDate: true,
        matchTime: true,
        matchStatus: true,
        scheduleStatus: true,
        homeScore: true,
        awayScore: true,
        publicNote: true,
        tournament: {
          select: {
            id: true,
            tournamentName: true,
            seasonId: true,
            season: {
              select: {
                seasonName: true,
              },
            },
          },
        },
        stageRound: {
          select: {
            roundName: true,
            roundType: true,
          },
        },
        venue: {
          select: {
            venueName: true,
            addressLine1: true,
            city: true,
            stateProvince: true,
            postalCode: true,
            country: true,
          },
        },
        homeEntry: {
          select: {
            entryName: true,
            members: {
              include: {
                player: {
                  select: {
                    firstName: true,
                    lastName: true,
                    country: true,
                    photoUrl: true,
                  },
                },
              },
            },
          },
        },
        awayEntry: {
          select: {
            entryName: true,
            members: {
              include: {
                player: {
                  select: {
                    firstName: true,
                    lastName: true,
                    country: true,
                    photoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!match) {
      return publicApiJson({ error: "Fixture not found" }, { status: 404 });
    }

    return publicApiJson({
      fixture: {
        id: match.id,
        fixtureId: match.id,
        fixtureDateTime: toIsoDateTime(match.matchDate, match.matchTime),
        fixtureTime: toTimeString(match.matchDate, match.matchTime),
        homeTeamName: getEntryDisplayName(match.homeEntry),
        roadTeamName: getEntryDisplayName(match.awayEntry),
        homeCountryCode: getEntryCountryCode(match.homeEntry),
        roadCountryCode: getEntryCountryCode(match.awayEntry),
        homePlayerPhotoUrl: getEntryPhotoUrl(match.homeEntry),
        roadPlayerPhotoUrl: getEntryPhotoUrl(match.awayEntry),
        homeScore: match.homeScore,
        roadScore: match.awayScore,
        fixtureGroupIdentifier: match.tournament.id,
        fixtureGroupDesc: match.tournament.tournamentName,
        roundDesc: match.stageRound.roundName,
        roundType: match.stageRound.roundType,
        seasonId: match.tournament.seasonId,
        seasonDesc: match.tournament.season.seasonName,
        matchStatus: match.matchStatus,
        scheduleStatus: match.scheduleStatus,
        publicNote: match.publicNote,
        venue: buildVenueSummary(match),
      },
    });
  } catch (error) {
    console.error("GET /api/public/fixtures/[id] error:", error);

    return publicApiJson(
      {
        error: "Failed to fetch fixture",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}