import { NextResponse } from "next/server";
import { resolveCurrentAdminUser } from "@/lib/admin-auth";

export async function GET() {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No current admin user resolved." }, { status: 401 });
    }

    return NextResponse.json(currentUser);
  } catch (error) {
    console.error("GET /api/admin/me error:", error);

    return NextResponse.json(
      {
        error: "Failed to resolve current admin user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}