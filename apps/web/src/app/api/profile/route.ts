import { NextResponse } from "next/server";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function parseOptionalString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function parseRequiredString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized;
}

function parseOptionalDate(value: unknown) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

async function loadPlayerForCurrentUser() {
  const currentUser = await resolveCurrentUser();

  if (!currentUser) {
    return {
      currentUser: null,
      player: null,
    };
  }

  if (!currentUser.linkedPlayerId) {
    return {
      currentUser,
      player: null,
    };
  }

  const player = await prisma.player.findUnique({
    where: { id: currentUser.linkedPlayerId },
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      dateOfBirth: true,
      emailAddress: true,
      phoneNumber: true,
      photoUrl: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      stateProvince: true,
      country: true,
      postalCode: true,
      updatedAt: true,
    },
  });

  return {
    currentUser,
    player,
  };
}

export async function GET() {
  try {
    const { currentUser, player } = await loadPlayerForCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!player) {
      return NextResponse.json(
        { error: "No linked player profile found for this account." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: currentUser.id,
        displayName: currentUser.displayName,
        email: currentUser.email,
        username: currentUser.username,
      },
      player,
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);

    return NextResponse.json(
      { error: "Failed to load profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { currentUser, player } = await loadPlayerForCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!player) {
      return NextResponse.json(
        { error: "No linked player profile found for this account." },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);

    const firstName = parseRequiredString(body?.firstName);
    const middleInitial = parseOptionalString(body?.middleInitial);
    const lastName = parseRequiredString(body?.lastName);
    const dateOfBirth = parseOptionalDate(body?.dateOfBirth);
    const emailAddress = parseOptionalString(body?.emailAddress);
    const phoneNumber = parseOptionalString(body?.phoneNumber);
    const photoUrl = parseOptionalString(body?.photoUrl);
    const addressLine1 = parseOptionalString(body?.addressLine1);
    const addressLine2 = parseOptionalString(body?.addressLine2);
    const city = parseOptionalString(body?.city);
    const stateProvince = parseOptionalString(body?.stateProvince);
    const country = parseOptionalString(body?.country);
    const postalCode = parseOptionalString(body?.postalCode);

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (body?.dateOfBirth && !dateOfBirth) {
      return NextResponse.json(
        { error: "Date of birth must be a valid date." },
        { status: 400 }
      );
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: player.id },
      data: {
        firstName,
        middleInitial,
        lastName,
        dateOfBirth,
        emailAddress,
        phoneNumber,
        photoUrl,
        addressLine1,
        addressLine2,
        city,
        stateProvince,
        country,
        postalCode,
      },
      select: {
        id: true,
        firstName: true,
        middleInitial: true,
        lastName: true,
        dateOfBirth: true,
        emailAddress: true,
        phoneNumber: true,
        photoUrl: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        stateProvince: true,
        country: true,
        postalCode: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, player: updatedPlayer });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);

    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
