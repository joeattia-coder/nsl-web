import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
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
    });

    if (!existingPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    await prisma.player.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Player deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/players/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete player",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}