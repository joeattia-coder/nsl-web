import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TERMS_CONTENT_HTML,
  DEFAULT_TERMS_TITLE,
  isTermsTableMissingError,
} from "@/lib/terms";

export async function GET() {
  try {
    const latest = await prisma.termsOfServiceVersion.findFirst({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        contentHtml: true,
        publishedAt: true,
      },
    });

    if (!latest) {
      return NextResponse.json({
        version: {
          id: null,
          title: DEFAULT_TERMS_TITLE,
          contentHtml: DEFAULT_TERMS_CONTENT_HTML,
          publishedAt: null,
          publishedAtLabel: null,
          exists: false,
        },
      });
    }

    return NextResponse.json({
      version: {
        id: latest.id,
        title: latest.title,
        contentHtml: latest.contentHtml,
        publishedAt: latest.publishedAt.toISOString(),
        publishedAtLabel: null,
        exists: true,
      },
    });
  } catch (error) {
    console.error("GET /api/terms/latest error:", error);

    if (isTermsTableMissingError(error)) {
      return NextResponse.json({
        version: {
          id: null,
          title: DEFAULT_TERMS_TITLE,
          contentHtml: DEFAULT_TERMS_CONTENT_HTML,
          publishedAt: null,
          publishedAtLabel: null,
          exists: false,
        },
      });
    }

    return NextResponse.json(
      {
        error: "Failed to load latest terms",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}