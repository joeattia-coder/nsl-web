import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ venue_id: string }> }
) {
  try {
    const { venue_id } = await context.params;

    const venue = await prisma.venue.findUnique({
      where: { id: venue_id },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error("GET /api/venues/[venue_id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch venue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ venue_id: string }> }
) {
  try {
    const { venue_id } = await context.params;
    const body = await request.json();

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venue_id },
    });

    if (!existingVenue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    const venue = await prisma.venue.update({
      where: { id: venue_id },
      data: {
        venueName: body.venueName ?? existingVenue.venueName,
        addressLine1: body.addressLine1 ?? existingVenue.addressLine1,
        addressLine2: body.addressLine2 ?? existingVenue.addressLine2,
        city: body.city ?? existingVenue.city,
        stateProvince: body.stateProvince ?? existingVenue.stateProvince,
        country: body.country ?? existingVenue.country,
        postalCode: body.postalCode ?? existingVenue.postalCode,
        phoneNumber: body.phoneNumber ?? existingVenue.phoneNumber,
        mapLink: body.mapLink ?? existingVenue.mapLink,
        showOnVenuesPage:
          body.showOnVenuesPage ?? existingVenue.showOnVenuesPage,
        isActive: body.isActive ?? existingVenue.isActive,
      },
    });

    return NextResponse.json(venue);
  } catch (error) {
    console.error("PATCH /api/venues/[venue_id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update venue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ venue_id: string }> }
) {
  try {
    const { venue_id } = await context.params;

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venue_id },
    });

    if (!existingVenue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    await prisma.venue.delete({
      where: { id: venue_id },
    });

    return NextResponse.json({
      message: "Venue deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/venues/[venue_id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete venue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}