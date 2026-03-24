import { prisma } from "@/lib/prisma";
import {
  DEFAULT_TERMS_CONTENT_HTML,
  DEFAULT_TERMS_TITLE,
  isTermsTableMissingError,
} from "@/lib/terms";
import LocalTimeText from "@/components/LocalTimeText";
import styles from "./TermsPage.module.css";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  let latest: {
    title: string;
    contentHtml: string;
    publishedAt: Date;
  } | null = null;

  try {
    latest = await prisma.termsOfServiceVersion.findFirst({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        title: true,
        contentHtml: true,
        publishedAt: true,
      },
    });
  } catch (error) {
    if (!isTermsTableMissingError(error)) {
      throw error;
    }
  }

  const title = latest?.title ?? DEFAULT_TERMS_TITLE;
  const contentHtml = latest?.contentHtml ?? DEFAULT_TERMS_CONTENT_HTML;

  return (
    <main className={styles.termsPage}>
      <section className={styles.termsSection}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Legal</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            {latest?.publishedAt ? (
              <>
                Last updated <LocalTimeText value={latest.publishedAt.toISOString()} options={{ year: "numeric", month: "long", day: "numeric" }} />.
              </>
            ) : (
              "The current Terms of Service will appear here once published."
            )}
          </p>
        </header>

        <div className={styles.statementCard}>
          <div
            className={`${styles.statement} news-article-body`}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </section>
    </main>
  );
}