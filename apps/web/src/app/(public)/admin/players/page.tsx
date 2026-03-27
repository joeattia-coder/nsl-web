import { prisma } from "@/lib/prisma";
import { summarizeAccountSetupInvitation } from "@/lib/admin-player-invitations";
import { formatAdminPhoneNumber } from "@/lib/phone-format";
import PlayersTable from "./players-table";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const players = await prisma.player.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      emailAddress: true,
      phoneNumber: true,
      country: true,
      photoUrl: true,
      userId: true,
      invitations: {
        where: {
          purpose: "ACCOUNT_SETUP",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          status: true,
          createdAt: true,
          expiresAt: true,
          acceptedAt: true,
          revokedAt: true,
        },
      },
      entryMembers: {
        select: {
          tournamentEntry: {
            select: {
              tournament: {
                select: {
                  id: true,
                  tournamentName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const formattedPlayers = players.map((player) => ({
    ...summarizeAccountSetupInvitation(player.invitations[0]),
    tournaments: Array.from(
      new Map(
        player.entryMembers.map((member) => [
          member.tournamentEntry.tournament.id,
          {
            id: member.tournamentEntry.tournament.id,
            name: member.tournamentEntry.tournament.tournamentName,
          },
        ])
      ).values()
    ).sort((left, right) => left.name.localeCompare(right.name)),
    id: player.id,
    fullName: [player.firstName, player.middleInitial, player.lastName]
      .filter(Boolean)
      .join(" "),
    email: player.emailAddress ?? "",
    phoneNumber: formatAdminPhoneNumber(player.phoneNumber),
    country: player.country ?? "",
    photoUrl: player.photoUrl ?? "",
    linkedUserId: player.userId ?? null,
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">Players</h1>
        <p className="admin-page-subtitle">
          Manage player profiles, contact details, and records.
        </p>
      </div>

      <PlayersTable players={formattedPlayers} />
    </section>
  );
}