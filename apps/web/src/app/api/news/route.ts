import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseHomeDisplayMode,
  parseHomePlacement,
  parseHomeSortOrder,
  parseNewsStatus,
  parseOptionalString,
  sanitizeNewsHtml,
  slugifyNewsTitle,
} from "@/lib/news";

async function ensureUniqueSlug(baseSlug: string) {
  const fallback = baseSlug || `news-${Date.now()}`;
  let slug = fallback;
  let suffix = 2;

  while (await prisma.newsArticle.findUnique({ where: { slug } })) {
    slug = `${fallback}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function GET() {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: [{ homeSortOrder: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("GET /api/news error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch news articles",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const title = String(data.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const contentHtml = sanitizeNewsHtml(String(data.contentHtml ?? ""));
    const status = parseNewsStatus(data.status);
    const showOnHomePage = Boolean(data.showOnHomePage);
    const homePlacement = showOnHomePage ? parseHomePlacement(data.homePlacement) : null;
    const homeDisplayMode = showOnHomePage
      ? parseHomeDisplayMode(data.homeDisplayMode)
      : null;

    const requestedSlug = parseOptionalString(data.slug);
    const slug = await ensureUniqueSlug(slugifyNewsTitle(requestedSlug || title));

    const article = await prisma.newsArticle.create({
      data: {
        title,
        slug,
        excerpt: parseOptionalString(data.excerpt),
        contentHtml,
        contentJson: data.contentJson ?? null,
        coverImageUrl: parseOptionalString(data.coverImageUrl),
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        showOnHomePage,
        homePlacement,
        homeDisplayMode,
        homeSortOrder: parseHomeSortOrder(data.homeSortOrder),
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("POST /api/news error:", error);

    return NextResponse.json(
      {
        error: "Failed to create news article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
