import { prisma } from "@/lib/prisma";
import { parseHomePlacement } from "@/lib/news";
import { publicApiJson, publicApiOptions } from "@/lib/public-api-response";

export function OPTIONS() {
  return publicApiOptions();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = parseHomePlacement(searchParams.get("placement"));
    const limitValue = Number(searchParams.get("limit") ?? "0");
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : undefined;

    const articles = await prisma.newsArticle.findMany({
      where: {
        status: "PUBLISHED",
        ...(placement ? { homePlacement: placement, showOnHomePage: true } : {}),
      },
      orderBy: [{ homeSortOrder: "asc" }, { publishedAt: "desc" }],
      ...(limit ? { take: limit } : {}),
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        homePlacement: true,
        homeDisplayMode: true,
        homeSortOrder: true,
        publishedAt: true,
      },
    });

    return publicApiJson({ articles });
  } catch (error) {
    console.error("GET /api/public/news error:", error);

    return publicApiJson(
      {
        error: "Failed to fetch public news",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}