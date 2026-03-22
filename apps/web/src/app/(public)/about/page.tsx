import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ABOUT_CONTENT_HTML,
  DEFAULT_ABOUT_SUBTITLE,
  DEFAULT_ABOUT_TITLE,
  isAboutTableMissingError,
} from "@/lib/about";
import styles from "./AboutPage.module.css";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  let latest: {
    title: string;
    subtitle: string | null;
    contentHtml: string;
  } | null = null;

  try {
    latest = await prisma.aboutSectionVersion.findFirst({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        title: true,
        subtitle: true,
        contentHtml: true,
      },
    });
  } catch (error) {
    if (!isAboutTableMissingError(error)) {
      throw error;
    }
  }

  const title = latest?.title ?? DEFAULT_ABOUT_TITLE;
  const subtitle = latest?.subtitle ?? DEFAULT_ABOUT_SUBTITLE;
  const contentHtml = latest?.contentHtml ?? DEFAULT_ABOUT_CONTENT_HTML;

  return (
    <main className={styles.aboutPage}>
      <section className={styles.aboutSection}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>About NSL</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
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