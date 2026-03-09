import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(seasons);
  } catch (error) {
    console.error("GET /api/seasons error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch seasons",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { seasonName, startDate, endDate, isActive } = body;

    if (!seasonName) {
      return NextResponse.json(
        { error: "seasonName is required" },
        { status: 400 }
      );
    }

    const season = await prisma.season.create({
      data: {
        seasonName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    console.error("POST /api/seasons error:", error);

    return NextResponse.json(
      {
        error: "Failed to create season",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}