import { NextResponse } from "next/server";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { getPlayerDashboardData } from "@/lib/player-performance";

export async function GET() {
  try {
    const currentUser = await resolveCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!currentUser.linkedPlayerId) {
      return NextResponse.json(
        { error: "No linked player profile found for this account." },
        { status: 404 }
      );
    }

    const dashboard = await getPlayerDashboardData(currentUser.linkedPlayerId);

    if (!dashboard) {
      return NextResponse.json(
        { error: "Player dashboard could not be loaded." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: currentUser.id,
        displayName: currentUser.displayName,
        email: currentUser.email,
        username: currentUser.username,
      },
      dashboard,
    });
  } catch (error) {
    console.error("GET /api/player-dashboard error:", error);

    return NextResponse.json({ error: "Failed to load player dashboard." }, { status: 500 });
  }
}