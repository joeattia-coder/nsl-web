"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
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
          <header className={styles.publicFaqHero}>
            <div className={styles.publicFaqHeroCopy}>
              <p className={styles.publicFaqEyebrow}>Help Center</p>
              <h1 className={styles.publicFaqTitle}>Frequently Asked Questions</h1>
              <p className={styles.publicFaqSubtitle}>
                Find quick answers about competitions, matches, accounts, and league operations without digging through multiple pages.
              </p>
            </div>
          </header>

          <section className={styles.publicFaqSearchCard}>
            <div className={styles.publicFaqSearchIntro}>
              <p className={styles.publicFaqSearchEyebrow}>Search FAQs</p>
              <h2 className={styles.publicFaqSearchTitle}>Find the answer faster.</h2>
              <p className={styles.publicFaqSearchDescription}>
                Search both the question title and the answer content to narrow the list instantly.
              </p>
            </div>

            <div className={styles.publicFaqSearch}>
              <label htmlFor="faq-search" className={styles.publicFaqSearchLabel}>
                Search FAQs
              </label>
              <div className={styles.publicFaqSearchInputWrap}>
                <FiSearch aria-hidden="true" className={styles.publicFaqSearchInputIcon} />
                <input
                  id="faq-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search questions and answers"
                  className={styles.publicFaqSearchInput}
                />
              </div>
            </div>
          </section>

          <section className={styles.publicFaqResultsSection}>
            <div className={styles.publicFaqResultsHeader}>
              <div>
                <p className={styles.publicFaqResultsEyebrow}>Answers</p>
                <h2 className={styles.publicFaqResultsTitle}>Browse the most common questions.</h2>
              </div>
              <p className={styles.publicFaqSearchMeta}>
                Showing {filteredFaqs.length} of {faqs.length}
              </p>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className={styles.publicFaqEmpty}>
                <h3>{query ? "No results found" : "No FAQs available"}</h3>
                <p>
                  {query
                    ? "Try a broader phrase or search for a single keyword like registration, fixtures, or account."
                    : "Published answers will appear here once FAQ items are available."}
                </p>
              </div>
            ) : (
              <div className={styles.publicFaqList}>
                {filteredFaqs.map((faq) => (
                  <details key={faq.id} className={styles.publicFaqItem}>
                    <summary className={styles.publicFaqQuestion}>
                      <span className={styles.publicFaqQuestionText}>{faq.question}</span>
                      <span className={styles.publicFaqQuestionIcon} aria-hidden="true" />
                    </summary>
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
        </section>
      </div>
    </main>
  );
}
