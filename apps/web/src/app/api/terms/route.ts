import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TERMS_CONTENT_HTML,
  DEFAULT_TERMS_TITLE,
  isTermsTableMissingError,
  parseOptionalTermsText,
  parseTermsPublishedAt,
  sanitizeTermsHtml,
} from "@/lib/terms";

export async function GET() {
  try {
    const versions = await prisma.termsOfServiceVersion.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("GET /api/terms error:", error);

    if (isTermsTableMissingError(error)) {
      return NextResponse.json({ versions: [] });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch terms history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = parseOptionalTermsText(body.title) ?? DEFAULT_TERMS_TITLE;
    const contentHtml = sanitizeTermsHtml(String(body.contentHtml ?? ""));

    if (!contentHtml || contentHtml === "<p></p>") {
      return NextResponse.json({ error: "Terms content is required" }, { status: 400 });
    }

    const version = await prisma.termsOfServiceVersion.create({
      data: {
        title,
        contentHtml: contentHtml || DEFAULT_TERMS_CONTENT_HTML,
        contentJson: body.contentJson ?? null,
        publishedAt: parseTermsPublishedAt(body.publishedAt),
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("POST /api/terms error:", error);

    if (isTermsTableMissingError(error)) {
      return NextResponse.json(
        {
          error: "Terms storage is not available yet",
          details: "Apply the TermsOfServiceVersion migration before saving Terms content.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to save terms content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}