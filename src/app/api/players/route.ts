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
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
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

    const {
      firstName,
      middleInitial,
      lastName,
      dateOfBirth,
      emailAddress,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      country,
      postalCode,
      userId,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "firstName and lastName are required" },
        { status: 400 }
      );
    }

    const player = await prisma.player.create({
      data: {
        firstName,
        middleInitial: middleInitial ?? null,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        emailAddress: emailAddress ?? null,
        phoneNumber: phoneNumber ?? null,
        addressLine1: addressLine1 ?? null,
        addressLine2: addressLine2 ?? null,
        city: city ?? null,
        stateProvince: stateProvince ?? null,
        country: country ?? null,
        postalCode: postalCode ?? null,
        userId: userId ?? null,
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