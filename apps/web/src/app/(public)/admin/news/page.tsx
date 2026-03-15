import { prisma } from "@/lib/prisma";
import NewsTable from "./news-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const articles = await prisma.newsArticle.findMany({
    orderBy: [{ homeSortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      showOnHomePage: true,
      homePlacement: true,
      homeDisplayMode: true,
      homeSortOrder: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  const rows = articles.map((article) => ({
    ...article,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    updatedAt: article.updatedAt.toISOString(),
  }));

  return (
    <section className="admin-page">
      <div className="admin-players-header">
        <h1 className="admin-page-title">News</h1>
        <p className="admin-page-subtitle">
          Publish articles, upload imagery, and control homepage promotion.
        </p>
      </div>

      <NewsTable articles={rows} />
    </section>
  );
}
