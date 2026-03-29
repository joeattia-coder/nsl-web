import { NextResponse } from "next/server";
import { getPublicTournamentStandings } from "@/lib/public-standings";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fixtureGroupIdentifier = searchParams.get("fixtureGroupIdentifier");

    if (!fixtureGroupIdentifier) {
      return NextResponse.json(
        { error: "Missing fixtureGroupIdentifier query param" },
        { status: 400 }
      );
    }

    const standings = await getPublicTournamentStandings(fixtureGroupIdentifier);

    return NextResponse.json(standings);
  } catch (error) {
    console.error("Failed to load public standings", error);

    return NextResponse.json(
      { error: "Failed to load public standings" },
      { status: 500 }
    );
  }
}