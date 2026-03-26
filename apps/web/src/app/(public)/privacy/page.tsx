import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PRIVACY_CONTENT_HTML,
  DEFAULT_PRIVACY_TITLE,
  getPrivacyPolicyVersionDelegate,
  isPrivacyTableMissingError,
} from "@/lib/privacy";
import LocalTimeText from "@/components/LocalTimeText";
import styles from "../terms/TermsPage.module.css";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  let latest: {
    title: string;
    contentHtml: string;
    publishedAt: Date;
  } | null = null;

  try {
    const privacyPolicyVersions = getPrivacyPolicyVersionDelegate(prisma);

    if (privacyPolicyVersions) {
      latest = await privacyPolicyVersions.findFirst({
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          title: true,
          contentHtml: true,
          publishedAt: true,
        },
      });
    }
  } catch (error) {
    if (!isPrivacyTableMissingError(error)) {
      throw error;
    }
  }

  const title = latest?.title ?? DEFAULT_PRIVACY_TITLE;
  const contentHtml = latest?.contentHtml ?? DEFAULT_PRIVACY_CONTENT_HTML;

  return (
    <main className={styles.termsPage}>
      <section className={styles.termsSection}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Legal</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>
            {latest?.publishedAt ? (
              <>
                Last updated{" "}
                <LocalTimeText
                  value={latest.publishedAt.toISOString()}
                  options={{ year: "numeric", month: "long", day: "numeric" }}
                />
                .
              </>
            ) : (
              "The current Privacy Policy will appear here once published."
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