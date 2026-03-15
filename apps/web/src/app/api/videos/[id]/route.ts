import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  normalizeVideoUrl,
  parseCarouselSortOrder,
  parseVideoSourceType,
  resolveVideoTitle,
} from "@/lib/video-highlights";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const video = await prisma.videoHighlight.findUnique({ where: { id } });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error("GET /api/videos/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await prisma.videoHighlight.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body = await request.json();
    const requestedTitle = String(body.title ?? "").trim();
    const sourceType = parseVideoSourceType(body.sourceType);

    const normalizedVideoUrl = normalizeVideoUrl(sourceType, String(body.videoUrl ?? ""));
    if (!normalizedVideoUrl) {
      return NextResponse.json({ error: "Video URL is required." }, { status: 400 });
    }

    const title = await resolveVideoTitle(sourceType, requestedTitle, normalizedVideoUrl);

    const video = await prisma.videoHighlight.update({
      where: { id },
      data: {
        title,
        sourceType,
        videoUrl: normalizedVideoUrl,
        showInCarousel: Boolean(body.showInCarousel),
        carouselSortOrder: parseCarouselSortOrder(body.carouselSortOrder),
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error("PUT /api/videos/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.videoHighlight.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/videos/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}