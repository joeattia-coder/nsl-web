import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildLeagueAdminPermissionScopes,
  hasAnyAdminPermission,
  hasAdminPermission,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";
import cuid from "cuid";

export async function GET() {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAnyAdminPermission(currentUser, "leagues.view")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const leagues = await prisma.league.findMany({
      orderBy: [{ leagueName: "asc" }],
    });

    return NextResponse.json(
      leagues.filter((league) =>
        hasScopedAdminPermission(
          currentUser,
          "leagues.view",
          buildLeagueAdminPermissionScopes(league.id)
        )
      )
    );
  } catch (error) {
    console.error("GET /api/leagues error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch leagues",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "leagues.create")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const data = await req.json();

    const leagueName = String(data.leagueName ?? "").trim();
    const description = data.description ? String(data.description).trim() : null;
    const logoUrl = data.logoUrl ? String(data.logoUrl).trim() : null;
    const isActive = typeof data.isActive === "boolean" ? data.isActive : true;

    if (!leagueName) {
      return NextResponse.json(
        { error: "leagueName is required" },
        { status: 400 }
      );
    }

    const league = await prisma.league.create({
      data: {
        id: cuid(),
        leagueName,
        description,
        isActive,
        logoUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    console.error("POST /api/leagues error:", error);

    return NextResponse.json(
      {
        error: "Failed to create league",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
