import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrivacyPolicyVersionDelegate, isPrivacyTableMissingError } from "@/lib/privacy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const privacyPolicyVersions = getPrivacyPolicyVersionDelegate(prisma);

    if (!privacyPolicyVersions) {
      return NextResponse.json(
        {
          error: "Privacy Policy storage is not available yet",
          details: "Restart the web server after regenerating Prisma client and apply the PrivacyPolicyVersion migration before deleting Privacy Policy history.",
        },
        { status: 503 }
      );
    }

    const { id } = await context.params;

    const current = await privacyPolicyVersions.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Privacy Policy history entry not found" }, { status: 404 });
    }

    const latest = await privacyPolicyVersions.findFirst({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });

    if (latest?.id === id) {
      return NextResponse.json(
        { error: "The latest Privacy Policy cannot be deleted. Save a new version first." },
        { status: 400 }
      );
    }

    await privacyPolicyVersions.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/privacy/[id] error:", error);

    if (isPrivacyTableMissingError(error)) {
      return NextResponse.json(
        {
          error: "Privacy Policy storage is not available yet",
          details: "Apply the PrivacyPolicyVersion migration before deleting Privacy Policy history.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to delete privacy policy history entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}