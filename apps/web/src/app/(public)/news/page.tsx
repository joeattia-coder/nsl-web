import Image from "next/image";
import Link from "next/link";
import LocalTimeText from "@/components/LocalTimeText";
import { prisma } from "@/lib/prisma";
import styles from "./NewsListingPage.module.css";

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

  const featuredArticle = articles[0] ?? null;
  const remainingArticles = featuredArticle ? articles.slice(1) : [];

  return (
    <main className={styles.newsPage}>
      <section className={styles.newsSection}>
        <header className={styles.newsHero}>
          <div className={styles.newsHeroCopy}>
            <p className={styles.newsEyebrow}>NSL Newsroom</p>
            <h1 className={styles.newsTitle}>Latest league stories</h1>
            <p className={styles.newsSubtitle}>
              Match reports, announcements, and editorial updates from across the National Snooker League.
            </p>
          </div>
        </header>

        {articles.length === 0 ? (
          <div className={styles.emptyState}>
            No published news yet.
          </div>
        ) : (
          <>
            {featuredArticle ? (
              <section className={styles.featuredStorySection}>
                <article className={styles.featuredStoryCard}>
                  {featuredArticle.coverImageUrl ? (
                    <Image
                      src={featuredArticle.coverImageUrl}
                      alt={featuredArticle.title}
                      width={1440}
                      height={840}
                      className={styles.featuredStoryImage}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                    />
                  ) : (
                    <div className={styles.featuredStoryFallback}>NSL News</div>
                  )}

                  <div className={styles.featuredStoryBody}>
                    <p className={styles.featuredStoryLabel}>Featured story</p>
                    <h2 className={styles.featuredStoryTitle}>
                      <Link href={`/news/${featuredArticle.slug}`} className={styles.featuredStoryTitleLink}>
                        {featuredArticle.title}
                      </Link>
                    </h2>
                    <p className={styles.featuredStoryDate}>
                      <LocalTimeText
                        value={(featuredArticle.publishedAt ?? featuredArticle.updatedAt).toISOString()}
                        options={{ year: "numeric", month: "long", day: "numeric" }}
                      />
                    </p>
                    <p className={styles.featuredStoryExcerpt}>
                      {featuredArticle.excerpt || "Read the full story for details from the NSL newsroom."}
                    </p>
                    <Link href={`/news/${featuredArticle.slug}`} className={styles.newsCardLink}>
                      Read Featured Story
                    </Link>
                  </div>
                </article>
              </section>
            ) : null}

            <section className={styles.newsFeedSection}>
              <div className={styles.newsFeedHeader}>
                <div>
                  <p className={styles.newsFeedLabel}>Archive</p>
                  <h2 className={styles.newsFeedTitle}>
                    {remainingArticles.length > 0 ? "More stories from the newsroom." : "The latest story is live now."}
                  </h2>
                </div>
                <p className={styles.newsFeedMeta}>{articles.length} published {articles.length === 1 ? "article" : "articles"}</p>
              </div>

              {remainingArticles.length === 0 ? (
                <div className={styles.singleStoryState}>
                  The featured story above is currently the newest and only published article.
                </div>
              ) : (
                <div className={styles.newsGrid}>
                  {remainingArticles.map((article) => (
                    <article
                      key={article.id}
                      className={styles.newsCard}
                    >
                      {article.coverImageUrl ? (
                        <Image
                          src={article.coverImageUrl}
                          alt={article.title}
                          width={960}
                          height={560}
                          className={styles.newsCardImage}
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                      ) : (
                        <div className={styles.newsCardFallback}>
                          NSL News
                        </div>
                      )}
                      <div className={styles.newsCardBody}>
                        <p className={styles.newsCardDate}>
                          <LocalTimeText
                            value={(article.publishedAt ?? article.updatedAt).toISOString()}
                            options={{ year: "numeric", month: "long", day: "numeric" }}
                          />
                        </p>
                        <h2 className={styles.newsCardTitle}>
                          <Link href={`/news/${article.slug}`} className={styles.newsCardTitleLink}>
                            {article.title}
                          </Link>
                        </h2>
                        <p className={styles.newsCardExcerpt}>
                          {article.excerpt || "Read the full story for details from the NSL newsroom."}
                        </p>
                        <Link
                          href={`/news/${article.slug}`}
                          className={styles.newsCardLink}
                        >
                          Read Article
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
