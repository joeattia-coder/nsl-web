"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { FiArrowRight, FiExternalLink, FiLoader, FiX } from "react-icons/fi";

type TermsSnapshot = {
  id: string | null;
  title: string;
  contentHtml: string;
  publishedAt: string | null;
  publishedAtLabel: string | null;
  exists: boolean;
};

type TermsFooterLinkProps = {
  className?: string;
  label?: string;
};

export default function TermsFooterLink({
  className = "site-footer-link",
  label = "Terms of Service",
}: TermsFooterLinkProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermsSnapshot | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const loadTerms = async () => {
    if (terms || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/terms/latest", { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.details || data?.error || "Failed to load Terms of Service.");
      }

      setTerms(data.version as TermsSnapshot);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load Terms of Service."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen: React.MouseEventHandler<HTMLAnchorElement> = async (event) => {
    event.preventDefault();
    setIsOpen(true);
    await loadTerms();
  };

  return (
    <>
      <Link href="/terms" className={className} onClick={(event) => void handleOpen(event)}>
        {label}
      </Link>

      {isMounted && isOpen
        ? createPortal(
            <div
              className="terms-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="terms-modal-title"
            >
              <button
                type="button"
                className="terms-modal-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close terms dialog"
              >
                <FiX aria-hidden="true" />
              </button>

              <div className="terms-modal-frame">
                <div className="terms-modal-header">
                  <div className="terms-modal-copy">
                    <p className="terms-modal-eyebrow">Terms of Service</p>
                    <h2 id="terms-modal-title" className="terms-modal-title">
                      {terms?.title ?? "Terms of Service"}
                    </h2>
                    <p className="terms-modal-subtitle">
                      {terms?.publishedAtLabel
                        ? `Last updated ${terms.publishedAtLabel}.`
                        : "Preview the latest published terms."}
                    </p>
                  </div>

                  <Link href="/terms" className="terms-modal-page-link" onClick={() => setIsOpen(false)}>
                    <span>Open full page</span>
                    <FiExternalLink aria-hidden="true" />
                  </Link>
                </div>

                <div className="terms-modal-body">
                  {isLoading ? (
                    <div className="terms-modal-empty-state">
                      <FiLoader className="terms-modal-spinner" aria-hidden="true" />
                      <span>Loading the latest Terms of Service...</span>
                    </div>
                  ) : error ? (
                    <div className="terms-modal-empty-state terms-modal-empty-state-error">
                      <span>{error}</span>
                    </div>
                  ) : (
                    <div
                      className="terms-modal-content news-article-body"
                      dangerouslySetInnerHTML={{
                        __html:
                          terms?.contentHtml ??
                          "<p>The latest Terms of Service are not available yet.</p>",
                      }}
                    />
                  )}
                </div>

                <div className="terms-modal-footer">
                  <Link href="/terms" className="terms-modal-inline-link" onClick={() => setIsOpen(false)}>
                    <span>Review the full Terms page</span>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}