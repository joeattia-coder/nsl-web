import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizeVideoUrl,
  parseCarouselSortOrder,
  parseVideoSourceType,
  resolveVideoTitle,
} from "@/lib/video-highlights";

export async function GET() {
  try {
    const videos = await prisma.videoHighlight.findMany({
      orderBy: [{ carouselSortOrder: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("GET /api/videos error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch videos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestedTitle = String(body.title ?? "").trim();
    const sourceType = parseVideoSourceType(body.sourceType);

    const normalizedVideoUrl = normalizeVideoUrl(sourceType, String(body.videoUrl ?? ""));
    if (!normalizedVideoUrl) {
      return NextResponse.json({ error: "Video URL is required." }, { status: 400 });
    }

    const title = await resolveVideoTitle(sourceType, requestedTitle, normalizedVideoUrl);

    const video = await prisma.videoHighlight.create({
      data: {
        title,
        sourceType,
        videoUrl: normalizedVideoUrl,
        showInCarousel: Boolean(body.showInCarousel),
        carouselSortOrder: parseCarouselSortOrder(body.carouselSortOrder),
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("POST /api/videos error:", error);

    return NextResponse.json(
      {
        error: "Failed to create video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}