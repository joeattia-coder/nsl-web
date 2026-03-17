import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import styles from "./NewsArticlePage.module.css";

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
    <main className={styles.newsArticlePage}>
      <article className={styles.newsArticleContainer}>
        <div className={`news-article-flow ${styles.newsArticleFlow}`}>
          {article.coverImageUrl ? (
            <figure className="news-article-hero-image">
              <Image
                src={article.coverImageUrl}
                alt={article.title}
                width={1600}
                height={900}
                className={styles.newsArticleHeroImage}
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </figure>
          ) : null}

          <p className={styles.newsArticleDate}>
            {publishedDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className={styles.newsArticleTitle}>
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className={styles.newsArticleExcerpt}>{article.excerpt}</p>
          ) : null}

          {article.excerpt ? <div aria-hidden="true" className={styles.newsArticleSpacer} /> : null}

          <div
            className={`news-article-body ${styles.newsArticleBody}`}
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        </div>
      </article>
    </main>
  );
}
