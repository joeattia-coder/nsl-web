import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVideoPresentation } from "@/lib/video-highlights";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(24, Number(searchParams.get("limit") ?? "12") || 12));

    const videos = await prisma.videoHighlight.findMany({
      where: {
        showInCarousel: true,
      },
      orderBy: [{ carouselSortOrder: "asc" }, { updatedAt: "desc" }],
      take: limit,
    });

    return NextResponse.json({
      videos: videos.map((video) => ({
        id: video.id,
        title: video.title,
        sourceType: video.sourceType,
        videoUrl: video.videoUrl,
        carouselSortOrder: video.carouselSortOrder,
        ...getVideoPresentation(video.sourceType, video.videoUrl),
      })),
    });
  } catch (error) {
    console.error("GET /api/public/videos error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch videos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}