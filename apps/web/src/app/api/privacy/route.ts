import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PRIVACY_CONTENT_HTML,
  DEFAULT_PRIVACY_TITLE,
  getPrivacyPolicyVersionDelegate,
  isPrivacyTableMissingError,
  parseOptionalPrivacyText,
  parsePrivacyPublishedAt,
  sanitizePrivacyHtml,
} from "@/lib/privacy";

export async function GET() {
  try {
    const privacyPolicyVersions = getPrivacyPolicyVersionDelegate(prisma);

    if (!privacyPolicyVersions) {
      return NextResponse.json({ versions: [] });
    }

    const versions = await privacyPolicyVersions.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("GET /api/privacy error:", error);

    if (isPrivacyTableMissingError(error)) {
      return NextResponse.json({ versions: [] });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch privacy policy history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const privacyPolicyVersions = getPrivacyPolicyVersionDelegate(prisma);

    if (!privacyPolicyVersions) {
      return NextResponse.json(
        {
          error: "Privacy Policy storage is not available yet",
          details: "Restart the web server after regenerating Prisma client and apply the PrivacyPolicyVersion migration before saving Privacy Policy content.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();

    const title = parseOptionalPrivacyText(body.title) ?? DEFAULT_PRIVACY_TITLE;
    const contentHtml = sanitizePrivacyHtml(String(body.contentHtml ?? ""));

    if (!contentHtml || contentHtml === "<p></p>") {
      return NextResponse.json({ error: "Privacy Policy content is required" }, { status: 400 });
    }

    const version = await privacyPolicyVersions.create({
      data: {
        title,
        contentHtml: contentHtml || DEFAULT_PRIVACY_CONTENT_HTML,
        contentJson: body.contentJson ?? null,
        publishedAt: parsePrivacyPublishedAt(body.publishedAt),
      },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("POST /api/privacy error:", error);

    if (isPrivacyTableMissingError(error)) {
      return NextResponse.json(
        {
          error: "Privacy Policy storage is not available yet",
          details: "Apply the PrivacyPolicyVersion migration before saving Privacy Policy content.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to save privacy policy content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}