import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getLeagueDependencySummary(id: string) {
  const [seasonCount, tournamentCount, stageCount, roundCount, groupCount, matchCount] =
    await Promise.all([
      prisma.season.count({ where: { leagueId: id } }),
      prisma.tournament.count({ where: { season: { leagueId: id } } }),
      prisma.tournamentStage.count({
        where: { tournament: { season: { leagueId: id } } },
      }),
      prisma.stageRound.count({
        where: {
          tournamentStage: { tournament: { season: { leagueId: id } } },
        },
      }),
      prisma.tournamentGroup.count({
        where: {
          stageRound: {
            tournamentStage: { tournament: { season: { leagueId: id } } },
          },
        },
      }),
      prisma.match.count({
        where: { tournament: { season: { leagueId: id } } },
      }),
    ]);

  const parts = [
    seasonCount ? `${seasonCount} season${seasonCount === 1 ? "" : "s"}` : null,
    tournamentCount
      ? `${tournamentCount} tournament${tournamentCount === 1 ? "" : "s"}`
      : null,
    stageCount ? `${stageCount} stage${stageCount === 1 ? "" : "s"}` : null,
    roundCount ? `${roundCount} round${roundCount === 1 ? "" : "s"}` : null,
    groupCount ? `${groupCount} group${groupCount === 1 ? "" : "s"}` : null,
    matchCount ? `${matchCount} match${matchCount === 1 ? "" : "es"}` : null,
  ].filter(Boolean) as string[];

  return parts.join(", ");
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const league = await prisma.league.findUnique({
      where: { id },
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    return NextResponse.json(league);
  } catch (err) {
    console.error("GET /api/leagues/[id] error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch league",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await req.json();

    const league = await prisma.league.update({
      where: { id },
      data: {
        leagueName: data.leagueName,
        description: data.description,
        isActive: data.isActive,
        logoUrl: data.logoUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(league);
  } catch (err) {
    console.error("PUT /api/leagues/[id] error:", err);
    return NextResponse.json(
      {
        error: "Failed to update league",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const dependencySummary = await getLeagueDependencySummary(id);

    if (dependencySummary) {
      return NextResponse.json(
        {
          error: "League cannot be deleted",
          details: `This league still contains ${dependencySummary}. Remove the related data first.`,
        },
        { status: 409 }
      );
    }

    await prisma.league.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/leagues/[id] error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete league",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
