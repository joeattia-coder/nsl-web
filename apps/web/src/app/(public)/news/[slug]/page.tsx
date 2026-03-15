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
      <article className="mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.1)]">
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt={article.title} className="h-[320px] w-full object-cover md:h-[420px]" />
        ) : null}

        <div className="px-6 py-8 md:px-12 md:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">
            {publishedDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p className="mt-5 text-lg leading-8 text-slate-600">{article.excerpt}</p>
          ) : null}

          <div
            className="prose prose-slate mt-10 max-w-none prose-headings:font-semibold prose-a:text-sky-700 prose-img:rounded-2xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        </div>
      </article>
    </main>
  );
}
