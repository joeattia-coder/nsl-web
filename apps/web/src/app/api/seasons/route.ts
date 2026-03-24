import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateInTimeZone } from "@/lib/timezone";

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        League: {
          select: {
            id: true,
            leagueName: true,
          },
        },
      },
      orderBy: {
        seasonName: "asc",
      },
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

    const seasonName = String(body.seasonName ?? "").trim();
    const leagueId = String(body.leagueId ?? "").trim();
    const startDate = parseDateInTimeZone(body.startDate);
    const endDate = parseDateInTimeZone(body.endDate);
    const isActive =
      typeof body.isActive === "boolean" ? body.isActive : true;

    if (!leagueId) {
      return NextResponse.json(
        { error: "leagueId is required" },
        { status: 400 }
      );
    }

    if (!seasonName) {
      return NextResponse.json(
        { error: "seasonName is required" },
        { status: 400 }
      );
    }

    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { id: true },
    });

    if (!league) {
      return NextResponse.json(
        { error: "Selected league was not found" },
        { status: 404 }
      );
    }

    const season = await prisma.season.create({
      data: {
        seasonName,
        leagueId,
        startDate,
        endDate,
        isActive,
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