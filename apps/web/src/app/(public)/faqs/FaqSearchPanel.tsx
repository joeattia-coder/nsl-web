"use client";

import { useMemo, useState } from "react";

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
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] px-6 py-8 text-white md:px-10 md:py-10 lg:px-12 lg:py-12">
      <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-[#0ea5e9]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-72 w-72 rounded-full bg-[#f59e0b]/12 blur-3xl" />

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 md:gap-8">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-6 shadow-[0_16px_46px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8fd6ff] md:text-sm">
            Help Center
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base lg:text-lg">
            Find quick answers about tournaments, fixtures, account access, and match operations in one place.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <span className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-slate-200">
              {faqs.length} total questions
            </span>
            <span className="inline-flex rounded-full border border-[#8fd6ff]/30 bg-[#8fd6ff]/10 px-3 py-1 text-[#b8e6ff]">
              Live searchable knowledge base
            </span>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-[#0a0d12]/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm md:p-6">
          <div className="mb-4">
            <label htmlFor="faq-search" className="block text-sm font-semibold text-white">
              Search FAQs
            </label>
            <p className="mt-1 text-xs text-slate-400">
              Search by keyword, topic, or question title
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-[460px]">
              <div className="relative">
                <input
                  id="faq-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try: registration, schedule, player account..."
                  className="h-11 w-full rounded-lg border border-white/20 bg-[#0f141b] px-3 pr-10 text-sm text-white placeholder-slate-400 transition focus:border-[#8fd6ff] focus:outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
                  /
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 md:text-sm">
              <span>
                Showing <span className="font-semibold text-white">{filteredFaqs.length}</span> of{" "}
                <span className="font-semibold text-white">{faqs.length}</span>
              </span>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="inline-flex h-10 items-center rounded-md border border-[#8fd6ff]/40 bg-[#122232] px-3 text-sm font-semibold text-[#9adfff] transition hover:border-[#8fd6ff]/75 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b0d12] p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <h3 className="text-base font-semibold text-white">No results found</h3>
            <p className="mt-1 text-sm text-slate-300">
              {query ? "Try refining your search terms." : "No FAQs available at this time."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <details
                key={faq.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d12] shadow-[0_10px_26px_rgba(0,0,0,0.4)] transition hover:border-white/20"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left transition group-open:bg-white/[0.04] md:px-6 md:py-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#8fd6ff]" aria-hidden="true" />
                    <h2 className="pr-2 text-base font-semibold leading-snug text-white md:text-lg">
                      {faq.question}
                    </h2>
                  </div>
                  <svg
                    className="mt-1 h-5 w-5 flex-shrink-0 text-slate-300 transition duration-200 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4 md:px-6 md:py-5">
                  <article
                    className="prose prose-sm prose-invert max-w-none
                      prose-headings:font-semibold prose-headings:text-white prose-h2:text-base prose-h3:text-sm
                      prose-p:text-slate-200 prose-p:leading-relaxed
                      prose-a:text-[#8fd6ff] prose-a:no-underline hover:prose-a:text-white hover:prose-a:underline
                      prose-strong:text-white prose-strong:font-semibold
                      prose-code:rounded prose-code:bg-white/10 prose-code:px-2 prose-code:py-0.5 prose-code:text-slate-100
                      prose-pre:bg-[#05070c] prose-pre:text-slate-100
                      prose-img:rounded-md prose-img:border prose-img:border-white/15
                      prose-ul:text-slate-200 prose-li:text-slate-200
                      prose-blockquote:border-[#8fd6ff]/35 prose-blockquote:bg-[#8fd6ff]/10 prose-blockquote:text-slate-100"
                    dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                  />
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
