import { NextResponse } from "next/server";

import {
  getMatchAdminPermissionScopes,
  hasScopedAdminPermission,
  resolveCurrentAdminUser,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const permissionScopes = await getMatchAdminPermissionScopes(id);

    if (!permissionScopes) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    if (!hasScopedAdminPermission(currentUser, "matches.edit", permissionScopes)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const liveSession = await prisma.matchLiveSession.findUnique({
      where: {
        matchId: id,
      },
      select: {
        id: true,
        finalizedAt: true,
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found." }, { status: 404 });
    }

    if (liveSession.finalizedAt) {
      return NextResponse.json(
        {
          error: "This live-scored match has already been finalized. Use the admin match editor to adjust the official result.",
        },
        { status: 409 }
      );
    }

    await prisma.matchLiveSession.delete({
      where: {
        id: liveSession.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/matches/[id]/live-session/reset error:", error);

    return NextResponse.json(
      {
        error: "Failed to reset live session.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}