import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTermsTableMissingError } from "@/lib/terms";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const current = await prisma.termsOfServiceVersion.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Terms history entry not found" }, { status: 404 });
    }

    const latest = await prisma.termsOfServiceVersion.findFirst({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });

    if (latest?.id === id) {
      return NextResponse.json(
        { error: "The latest Terms of Service cannot be deleted. Save a new version first." },
        { status: 400 }
      );
    }

    await prisma.termsOfServiceVersion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/terms/[id] error:", error);

    if (isTermsTableMissingError(error)) {
      return NextResponse.json(
        {
          error: "Terms storage is not available yet",
          details: "Apply the TermsOfServiceVersion migration before deleting Terms history.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete terms history entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}