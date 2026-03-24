import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateInTimeZone } from "@/lib/timezone";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const season = await prisma.season.findUnique({
      where: { id },
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    return NextResponse.json(season);
  } catch (error) {
    console.error("GET /api/seasons/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch season",
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

    const existingSeason = await prisma.season.findUnique({
      where: { id },
    });

    if (!existingSeason) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    const seasonName =
      body.seasonName !== undefined
        ? String(body.seasonName).trim()
        : existingSeason.seasonName;
    const leagueId =
      body.leagueId !== undefined
        ? String(body.leagueId).trim()
        : existingSeason.leagueId ?? "";

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

    const season = await prisma.season.update({
      where: { id },
      data: {
        seasonName,
        leagueId,
        startDate:
          body.startDate !== undefined
            ? body.startDate
              ? parseDateInTimeZone(body.startDate)
              : null
            : existingSeason.startDate,
        endDate:
          body.endDate !== undefined
            ? body.endDate
              ? parseDateInTimeZone(body.endDate)
              : null
            : existingSeason.endDate,
        isActive:
          body.isActive !== undefined
            ? Boolean(body.isActive)
            : existingSeason.isActive,
      },
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error("PATCH /api/seasons/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update season",
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

    const existingSeason = await prisma.season.findUnique({
      where: { id },
    });

    if (!existingSeason) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    await prisma.season.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Season deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/seasons/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete season",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}