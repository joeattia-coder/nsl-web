import { NextResponse } from "next/server";
import { resolveCurrentUser } from "@/lib/admin-auth";

export async function GET() {
  try {
    const currentUser = await resolveCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No current user resolved." }, { status: 401 });
    }

    return NextResponse.json(currentUser);
  } catch (error) {
    console.error("GET /api/auth/me error:", error);

    return NextResponse.json(
      {
        error: "Failed to resolve current user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
