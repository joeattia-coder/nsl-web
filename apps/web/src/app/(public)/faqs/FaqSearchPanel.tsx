"use client";

import { useMemo, useState } from "react";
import styles from "./FaqSearchPanel.module.css";

export type PublicFaqItem = {
  id: string;
  question: string;
  answerHtml: string;
  sortOrder: number;
  updatedAt: string;
};

type FaqSearchPanelProps = {
  faqs: PublicFaqItem[];
};

function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export default function FaqSearchPanel({ faqs }: FaqSearchPanelProps) {
  const [query, setQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return faqs;

    return faqs.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(term) ||
        plainText(faq.answerHtml).includes(term)
      );
    });
  }, [faqs, query]);

  return (
    <main className={styles.publicFaqMain}>
      <div className={styles.publicFaqContainer}>
        <section className={styles.publicFaqSection}>
          <header className={styles.publicFaqHeader}>
            <h1 className={styles.publicFaqTitle}>Frequently Asked Questions</h1>
            <p className={styles.publicFaqSubtitle}>
              Find quick answers about competitions, matches, accounts, and league operations.
            </p>
          </header>

          <div className={styles.publicFaqSearch}>
            <label htmlFor="faq-search" className={styles.publicFaqSearchLabel}>
              Search FAQs
            </label>
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions and answers"
              className={styles.publicFaqSearchInput}
            />
            <p className={styles.publicFaqSearchMeta}>
              Showing {filteredFaqs.length} of {faqs.length}
            </p>
          </div>

          {filteredFaqs.length === 0 ? (
            <p className={styles.publicFaqEmpty}>{query ? "No results found." : "No FAQs available."}</p>
          ) : (
            <div className={styles.publicFaqList}>
              {filteredFaqs.map((faq) => (
                <details key={faq.id} className={styles.publicFaqItem}>
                  <summary className={styles.publicFaqQuestion}>{faq.question}</summary>
                  <div className={styles.publicFaqAnswer}>
                    <article
                      className={styles.publicFaqAnswerContent}
                      dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                    />
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
