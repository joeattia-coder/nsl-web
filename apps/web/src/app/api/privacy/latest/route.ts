import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PRIVACY_CONTENT_HTML,
  DEFAULT_PRIVACY_TITLE,
  getPrivacyPolicyVersionDelegate,
  isPrivacyTableMissingError,
} from "@/lib/privacy";

export async function GET() {
  try {
    const privacyPolicyVersions = getPrivacyPolicyVersionDelegate(prisma);

    if (!privacyPolicyVersions) {
      return NextResponse.json({
        version: {
          id: null,
          title: DEFAULT_PRIVACY_TITLE,
          contentHtml: DEFAULT_PRIVACY_CONTENT_HTML,
          publishedAt: null,
          publishedAtLabel: null,
          exists: false,
        },
      });
    }

    const latest = await privacyPolicyVersions.findFirst({
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
          title: DEFAULT_PRIVACY_TITLE,
          contentHtml: DEFAULT_PRIVACY_CONTENT_HTML,
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
    console.error("GET /api/privacy/latest error:", error);

    if (isPrivacyTableMissingError(error)) {
      return NextResponse.json({
        version: {
          id: null,
          title: DEFAULT_PRIVACY_TITLE,
          contentHtml: DEFAULT_PRIVACY_CONTENT_HTML,
          publishedAt: null,
          publishedAtLabel: null,
          exists: false,
        },
      });
    }

    return NextResponse.json(
      {
        error: "Failed to load latest privacy policy",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}