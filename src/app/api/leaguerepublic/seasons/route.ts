import { NextResponse } from "next/server";

export async function GET() {
  const leagueId = process.env.LEAGUEREPUBLIC_LEAGUE_ID;
  if (!leagueId) {
    return NextResponse.json(
      { error: "Missing LEAGUEREPUBLIC_LEAGUE_ID in .env.local" },
      { status: 500 }
    );
  }

  const url = `https://api.leaguerepublic.com/json/getSeasonsForLeague/${leagueId}.json`;

  const res = await fetch(url, {
    // optional: cache for a bit so you don't hammer the API
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "LeagueRepublic request failed", status: res.status },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}