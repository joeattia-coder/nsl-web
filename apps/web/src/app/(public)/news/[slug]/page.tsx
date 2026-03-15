import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const article = await prisma.newsArticle.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
  });

  if (!article) {
    notFound();
  }

  const publishedDate = article.publishedAt ?? article.updatedAt;

  return (
    <main className="content px-4 py-12 md:px-8">
      <article className="mx-auto max-w-6xl">
        <div className="news-article-flow text-slate-200">
          {article.coverImageUrl ? (
            <figure className="news-article-hero-image">
              <img src={article.coverImageUrl} alt={article.title} className="block h-auto w-full" />
            </figure>
          ) : null}

          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white">
            {publishedDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-white md:text-4xl">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="mt-6 max-w-4xl text-base leading-8 text-slate-300 md:text-lg">{article.excerpt}</p>
          ) : null}

          {article.excerpt ? <div aria-hidden="true" className="h-8 md:h-12" /> : null}

          <div
            className="news-article-body mt-0 max-w-none text-slate-200"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        </div>
      </article>
    </main>
  );
}
