import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewsListingPage() {
  const articles = await prisma.newsArticle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return (
    <main className="content px-4 py-12 md:px-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#93c5fd_100%)] px-8 py-10 text-white shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100">
            NSL Newsroom
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Latest league stories</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-100/90 md:text-lg">
            Match reports, announcements, and editorial updates from across the National Snooker League.
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            No published news yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]"
              >
                {article.coverImageUrl ? (
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-[radial-gradient(circle_at_top_left,#bfdbfe,transparent_48%),linear-gradient(135deg,#0f172a,#1e40af)] text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                    NSL News
                  </div>
                )}
                <div className="flex flex-col gap-4 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                    {(article.publishedAt ?? article.updatedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <h2 className="text-2xl font-semibold leading-tight text-slate-900">
                    <Link href={`/news/${article.slug}`} className="hover:text-sky-700">
                      {article.title}
                    </Link>
                  </h2>
                  <p className="text-sm leading-7 text-slate-600">
                    {article.excerpt || "Read the full story for details from the NSL newsroom."}
                  </p>
                  <Link
                    href={`/news/${article.slug}`}
                    className="inline-flex w-fit items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    Read Article
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
