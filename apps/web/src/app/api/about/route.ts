import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ABOUT_CONTENT_HTML,
  DEFAULT_ABOUT_SUBTITLE,
  DEFAULT_ABOUT_TITLE,
  isAboutTableMissingError,
  parseAboutPublishedAt,
  parseOptionalAboutText,
  sanitizeAboutHtml,
} from "@/lib/about";

export async function GET() {
  try {
    const versions = await prisma.aboutSectionVersion.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("GET /api/about error:", error);

    if (isAboutTableMissingError(error)) {
      return NextResponse.json({ versions: [] });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch about content history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = parseOptionalAboutText(body.title) ?? DEFAULT_ABOUT_TITLE;
    const subtitle = parseOptionalAboutText(body.subtitle) ?? DEFAULT_ABOUT_SUBTITLE;
    const contentHtml = sanitizeAboutHtml(String(body.contentHtml ?? ""));

    if (!contentHtml || contentHtml === "<p></p>") {
      return NextResponse.json({ error: "About content is required" }, { status: 400 });
    }

    const version = await prisma.aboutSectionVersion.create({
      data: {
        title,
        subtitle,
        contentHtml: contentHtml || DEFAULT_ABOUT_CONTENT_HTML,
        contentJson: body.contentJson ?? null,
        publishedAt: parseAboutPublishedAt(body.publishedAt),
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("POST /api/about error:", error);

    if (isAboutTableMissingError(error)) {
      return NextResponse.json(
        {
          error: "About content storage is not available yet",
          details: "Apply the AboutSectionVersion migration before saving About content.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to save about content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}