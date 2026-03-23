import { NextResponse } from "next/server";
import { getPlayerRankings } from "@/lib/player-performance";

// Helper to safely convert BigInt to string for JSON
function serializeBigInt(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    const rankings = await getPlayerRankings(tournamentId);

    return NextResponse.json({ players: serializeBigInt(rankings) });
  } catch (error) {
    console.error("GET /api/public/player-rankings error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch player rankings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
