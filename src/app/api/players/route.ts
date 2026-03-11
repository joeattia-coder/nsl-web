import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serializeBigInt(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json(serializeBigInt(players));
  } catch (error) {
    console.error("GET /api/players error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch players",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const firstName = String(body.firstName ?? "").trim();
    const middleInitial = String(body.middleInitial ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const dateOfBirth = body.dateOfBirth ? String(body.dateOfBirth) : null;
    const emailAddress = String(body.emailAddress ?? "").trim();
    const phoneNumber = String(body.phoneNumber ?? "").trim();
    const addressLine1 = String(body.addressLine1 ?? "").trim();
    const addressLine2 = String(body.addressLine2 ?? "").trim();
    const city = String(body.city ?? "").trim();
    const stateProvince = String(body.stateProvince ?? "").trim();
    const country = String(body.country ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim();
    const photoUrl = String(body.photoUrl ?? "").trim();
    const userId = String(body.userId ?? "").trim();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required." },
        { status: 400 }
      );
    }

    const player = await prisma.player.create({
      data: {
        firstName,
        middleInitial: middleInitial ? middleInitial.slice(0, 1).toUpperCase() : null,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        emailAddress: emailAddress || null,
        phoneNumber: phoneNumber || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        stateProvince: stateProvince || null,
        country: country || null,
        postalCode: postalCode || null,
        photoUrl: photoUrl || null,
        userId: userId || null,
      },
    });

    return NextResponse.json(serializeBigInt(player), { status: 201 });
  } catch (error) {
    console.error("POST /api/players error:", error);

    return NextResponse.json(
      {
        error: "Failed to create player",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}