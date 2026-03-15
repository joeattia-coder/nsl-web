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

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensureUniqueSlug(baseSlug: string, currentId: string) {
  const fallback = baseSlug || `news-${Date.now()}`;
  let slug = fallback;
  let suffix = 2;

  while (true) {
    const existing = await prisma.newsArticle.findUnique({ where: { slug } });
    if (!existing || existing.id === currentId) return slug;
    slug = `${fallback}-${suffix}`;
    suffix += 1;
  }
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const article = await prisma.newsArticle.findUnique({ where: { id } });

    if (!article) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("GET /api/news/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch news article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const current = await prisma.newsArticle.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 });
    }

    const data = await req.json();
    const title = String(data.title ?? "").trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const status = parseNewsStatus(data.status);
    const showOnHomePage = Boolean(data.showOnHomePage);
    const homePlacement = showOnHomePage ? parseHomePlacement(data.homePlacement) : null;
    const homeDisplayMode = showOnHomePage
      ? parseHomeDisplayMode(data.homeDisplayMode)
      : null;

    const requestedSlug = parseOptionalString(data.slug);
    const slug = await ensureUniqueSlug(slugifyNewsTitle(requestedSlug || title), id);

    const article = await prisma.newsArticle.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: parseOptionalString(data.excerpt),
        contentHtml: sanitizeNewsHtml(String(data.contentHtml ?? "")),
        contentJson: data.contentJson ?? null,
        coverImageUrl: parseOptionalString(data.coverImageUrl),
        status,
        publishedAt:
          status === "PUBLISHED"
            ? current.publishedAt ?? new Date()
            : null,
        showOnHomePage,
        homePlacement,
        homeDisplayMode,
        homeSortOrder: parseHomeSortOrder(data.homeSortOrder),
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("PUT /api/news/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update news article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.newsArticle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/news/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete news article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
