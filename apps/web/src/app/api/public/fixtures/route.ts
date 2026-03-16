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
  id: string;
  entryName: string | null;
  members: EntryMemberLike[];
};

export function OPTIONS() {
  return publicApiOptions();
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toCompactDateTime(date: Date | null, matchTime?: string | null) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());

  let hours = 0;
  let minutes = 0;

  if (matchTime && /^\d{1,2}:\d{2}$/.test(matchTime.trim())) {
    const [h, m] = matchTime.trim().split(":");
    hours = Number(h);
    minutes = Number(m);
  } else {
    hours = date.getHours();
    minutes = date.getMinutes();
  }

  return `${year}${month}${day} ${pad2(hours)}:${pad2(minutes)}`;
}

function toIsoDateTime(date: Date | null, matchTime?: string | null) {
  if (!date) return "";

  const d = new Date(date);

  if (matchTime && /^\d{1,2}:\d{2}$/.test(matchTime.trim())) {
    const [h, m] = matchTime.trim().split(":");
    d.setHours(Number(h), Number(m), 0, 0);
  }

  return d.toISOString();
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

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: {
        tournament: {
          isPublished: true,
        },
      },
      include: {
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
            id: true,
            roundName: true,
            roundType: true,
          },
        },
        homeEntry: {
          select: {
            id: true,
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
            id: true,
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
      orderBy: [
        { matchDate: "asc" },
        { matchTime: "asc" },
        { createdAt: "asc" },
      ],
    });

    const fixtures = matches.map((match) => {
      const homeName = getEntryDisplayName(match.homeEntry);
      const awayName = getEntryDisplayName(match.awayEntry);
      const homeCountryCode = getEntryCountryCode(match.homeEntry);
      const roadCountryCode = getEntryCountryCode(match.awayEntry);
      const fixtureDate = toCompactDateTime(match.matchDate, match.matchTime);
      const fixtureDateTime = toIsoDateTime(match.matchDate, match.matchTime);
      const fixtureTime = toTimeString(match.matchDate, match.matchTime);

      return {
        id: match.id,
        fixtureId: match.id,
        fixtureDate,
        fixtureDateTime,
        fixtureTime,
        homeTeamName: homeName,
        roadTeamName: awayName,
        homeCountryCode,
        roadCountryCode,
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
      };
    });

    return publicApiJson({
      count: fixtures.length,
      fixtures,
    });
  } catch (error) {
    console.error("Failed to load public fixtures", error);

    return publicApiJson(
      { error: "Failed to load public fixtures" },
      { status: 500 }
    );
  }
}