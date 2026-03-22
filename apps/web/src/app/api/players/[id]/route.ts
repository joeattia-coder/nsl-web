import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function buildFullName(firstName: string, middleInitial: string | null, lastName: string) {
  return [firstName, middleInitial, lastName].filter(Boolean).join(" ");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        dateOfBirth: true,
        emailAddress: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        stateProvince: true,
        country: true,
        postalCode: true,
        photoUrl: true,
        entryMembers: {
          select: {
            id: true,
            createdAt: true,
            tournamentEntry: {
              select: {
                id: true,
                entryName: true,
                tournament: {
                  select: {
                    id: true,
                    tournamentName: true,
                  },
                },
                members: {
                  orderBy: {
                    createdAt: "asc",
                  },
                  select: {
                    player: {
                      select: {
                        firstName: true,
                        middleInitial: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const entryMemberships = player.entryMembers
      .map((entryMember) => ({
        id: entryMember.id,
        createdAt: entryMember.createdAt,
        tournamentId: entryMember.tournamentEntry.tournament.id,
        tournamentName: entryMember.tournamentEntry.tournament.tournamentName,
        tournamentEntryId: entryMember.tournamentEntry.id,
        entryName:
          entryMember.tournamentEntry.entryName ||
          entryMember.tournamentEntry.members
            .map((member) =>
              buildFullName(
                member.player.firstName,
                member.player.middleInitial,
                member.player.lastName
              )
            )
            .join(" / "),
        memberNames: entryMember.tournamentEntry.members.map((member) =>
          buildFullName(
            member.player.firstName,
            member.player.middleInitial,
            member.player.lastName
          )
        ),
      }))
      .sort((left, right) => {
        const tournamentComparison = left.tournamentName.localeCompare(right.tournamentName, undefined, {
          sensitivity: "base",
        });

        if (tournamentComparison !== 0) {
          return tournamentComparison;
        }

        return left.entryName.localeCompare(right.entryName, undefined, {
          sensitivity: "base",
        });
      });

    return NextResponse.json({
      ...player,
      entryMemberships,
    });
  } catch (error) {
    console.error("GET /api/players/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch player",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existingPlayer = await prisma.player.findUnique({
      where: { id },
    });

    if (!existingPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const player = await prisma.player.update({
      where: { id },
      data: {
        firstName: body.firstName
          ? String(body.firstName).trim()
          : existingPlayer.firstName,
        middleInitial:
          body.middleInitial !== undefined
            ? body.middleInitial
              ? String(body.middleInitial).trim()
              : null
            : existingPlayer.middleInitial,
        lastName: body.lastName
          ? String(body.lastName).trim()
          : existingPlayer.lastName,
        dateOfBirth:
          body.dateOfBirth !== undefined
            ? body.dateOfBirth
              ? new Date(body.dateOfBirth)
              : null
            : existingPlayer.dateOfBirth,
        emailAddress:
          body.emailAddress !== undefined
            ? body.emailAddress
              ? String(body.emailAddress).trim()
              : null
            : existingPlayer.emailAddress,
        phoneNumber:
          body.phoneNumber !== undefined
            ? body.phoneNumber
              ? String(body.phoneNumber).trim()
              : null
            : existingPlayer.phoneNumber,
        addressLine1:
          body.addressLine1 !== undefined
            ? body.addressLine1
              ? String(body.addressLine1).trim()
              : null
            : existingPlayer.addressLine1,
        addressLine2:
          body.addressLine2 !== undefined
            ? body.addressLine2
              ? String(body.addressLine2).trim()
              : null
            : existingPlayer.addressLine2,
        city:
          body.city !== undefined
            ? body.city
              ? String(body.city).trim()
              : null
            : existingPlayer.city,
        stateProvince:
          body.stateProvince !== undefined
            ? body.stateProvince
              ? String(body.stateProvince).trim()
              : null
            : existingPlayer.stateProvince,
        country:
          body.country !== undefined
            ? body.country
              ? String(body.country).trim()
              : null
            : existingPlayer.country,
        postalCode:
          body.postalCode !== undefined
            ? body.postalCode
              ? String(body.postalCode).trim()
              : null
            : existingPlayer.postalCode,
        photoUrl:
          body.photoUrl !== undefined
            ? body.photoUrl
              ? String(body.photoUrl).trim()
              : null
            : existingPlayer.photoUrl,
      },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error("PATCH /api/players/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update player",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        _count: {
          select: {
            entryMembers: true,
          },
        },
        entryMembers: {
          select: {
            tournamentEntry: {
              select: {
                tournament: {
                  select: {
                    tournamentName: true,
                  },
                },
              },
            },
          },
          take: 3,
        },
      },
    });

    if (!existingPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (existingPlayer._count.entryMembers > 0) {
      const tournamentNames = [
        ...new Set(
          existingPlayer.entryMembers
            .map((entryMember) => entryMember.tournamentEntry.tournament.tournamentName)
            .filter(Boolean)
        ),
      ];

      const relatedTournamentSummary =
        tournamentNames.length > 0
          ? ` Related tournaments: ${tournamentNames.join(", ")}${existingPlayer._count.entryMembers > existingPlayer.entryMembers.length ? ", ..." : ""}.`
          : "";

      return NextResponse.json(
        {
          error:
            `This player cannot be deleted because they are still assigned to ${existingPlayer._count.entryMembers} tournament entr${existingPlayer._count.entryMembers === 1 ? "y" : "ies"}. Remove or reassign those tournament entries first.` +
            relatedTournamentSummary,
        },
        { status: 409 }
      );
    }

    await prisma.player.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Player deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/players/[id] error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "This player cannot be deleted because related records still reference them. Remove or reassign those records first.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete player",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}