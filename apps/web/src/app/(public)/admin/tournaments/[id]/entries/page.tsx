import { notFound } from "next/navigation";
import { normalizeCountryCode } from "@/lib/country";
import { prisma } from "@/lib/prisma";
import TournamentSubnav from "../TournamentSubnav";
import TournamentEntriesManager from "./TournamentEntriesManager";

function getPlayerFullName(player: {
  firstName: string;
  middleInitial: string | null;
  lastName: string;
}) {
  return [player.firstName, player.middleInitial, player.lastName]
    .filter(Boolean)
    .join(" ");
}

function getEntryDisplayName(entry: {
  entryName: string | null;
  members: Array<{
    player: {
      firstName: string;
      middleInitial: string | null;
      lastName: string;
    };
  }>;
}) {
  if (entry.entryName?.trim()) {
    return entry.entryName.trim();
  }

  const memberNames = entry.members.map(({ player }) => getPlayerFullName(player));
  return memberNames.join(" / ") || "Unnamed Entry";
}

function getEntryCountry(entry: {
  members: Array<{
    player: {
      country: string | null;
    };
  }>;
}) {
  const memberCountries = Array.from(
    new Set(
      entry.members
        .map(({ player }) => player.country?.trim() ?? "")
        .filter(Boolean)
    )
  );

  if (memberCountries.length !== 1) {
    return {
      countryName: memberCountries.length > 1 ? "Multiple countries" : "",
      countryCode: "",
    };
  }

  const countryName = memberCountries[0];

  return {
    countryName,
    countryCode: normalizeCountryCode(countryName),
  };
}

export const dynamic = "force-dynamic";

export default async function TournamentEntriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = await params;

  const [tournament, entries, players] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        tournamentName: true,
        participantType: true,
      },
    }),
    prisma.tournamentEntry.findMany({
      where: { tournamentId },
      include: {
        members: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                middleInitial: true,
                lastName: true,
                country: true,
              },
            },
          },
        },
      },
      orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
    }),
    prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        emailAddress: true,
        country: true,
      },
    }),
  ]);

  if (!tournament) {
    notFound();
  }

  const registeredPlayerIds = new Set(
    entries.flatMap((entry) => entry.members.map((member) => member.player.id))
  );

  const formattedEntries = entries.map((entry) => ({
    ...getEntryCountry(entry),
    id: entry.id,
    displayName: getEntryDisplayName(entry),
    seedNumber: entry.seedNumber,
    memberNames: entry.members.map(({ player }) => getPlayerFullName(player)),
  }));

  const formattedPlayers = players.map((player) => ({
    id: player.id,
    fullName: getPlayerFullName(player),
    email: player.emailAddress ?? "",
    alreadyRegistered: registeredPlayerIds.has(player.id),
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">{tournament.tournamentName}</h1>
        <p className="admin-page-subtitle">
          Register tournament participants and manage entries.
        </p>
      </div>

      <TournamentSubnav tournamentId={tournament.id} active="entries" />

      <TournamentEntriesManager
        tournamentId={tournament.id}
        tournamentName={tournament.tournamentName}
        participantType={tournament.participantType}
        entries={formattedEntries}
        players={formattedPlayers}
      />
    </section>
  );
}