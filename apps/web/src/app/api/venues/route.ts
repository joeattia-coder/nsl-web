import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: {
        venueName: "asc",
      },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error("GET /api/venues error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch venues",
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
      venueName,
      logoUrl,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      country,
      postalCode,
      phoneNumber,
      mapLink,
      showOnVenuesPage,
      isActive,
    } = body;

    if (!venueName) {
      return NextResponse.json(
        { error: "venueName is required" },
        { status: 400 }
      );
    }

    const venue = await prisma.venue.create({
      data: {
        venueName,
        logoUrl: logoUrl ?? null,
        addressLine1: addressLine1 ?? null,
        addressLine2: addressLine2 ?? null,
        city: city ?? null,
        stateProvince: stateProvince ?? null,
        country: country ?? null,
        postalCode: postalCode ?? null,
        phoneNumber: phoneNumber ?? null,
        mapLink: mapLink ?? null,
        showOnVenuesPage: showOnVenuesPage ?? true,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error("POST /api/venues error:", error);

    return NextResponse.json(
      {
        error: "Failed to create venue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}