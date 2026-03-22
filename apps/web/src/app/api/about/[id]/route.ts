import { NextResponse } from "next/server";
import { isAboutTableMissingError } from "@/lib/about";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const current = await prisma.aboutSectionVersion.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!current) {
      return NextResponse.json({ error: "About history entry not found" }, { status: 404 });
    }

    const latest = await prisma.aboutSectionVersion.findFirst({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });

    if (latest?.id === id) {
      return NextResponse.json(
        { error: "The latest About content cannot be deleted. Save a new version first." },
        { status: 400 }
      );
    }

    await prisma.aboutSectionVersion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/about/[id] error:", error);

    if (isAboutTableMissingError(error)) {
      return NextResponse.json(
        {
          error: "About content storage is not available yet",
          details: "Apply the AboutSectionVersion migration before deleting About history.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete about history entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}