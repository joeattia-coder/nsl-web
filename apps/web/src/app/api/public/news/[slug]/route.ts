import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { publicApiJson, publicApiOptions } from "@/lib/public-api-response";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function OPTIONS() {
  return publicApiOptions();
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const article = await prisma.newsArticle.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        contentHtml: true,
        coverImageUrl: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    if (!article) {
      return publicApiJson({ error: "Article not found" }, { status: 404 });
    }

    return publicApiJson({
      article: {
        ...article,
        publishedAt: article.publishedAt?.toISOString() ?? null,
        updatedAt: article.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/public/news/[slug] error:", error);

    return publicApiJson(
      {
        error: "Failed to fetch article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}