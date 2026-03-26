"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import LocalTimeText from "@/components/LocalTimeText";
import { FiArrowRight, FiExternalLink, FiLoader, FiX } from "react-icons/fi";

type PolicySnapshot = {
  id: string | null;
  title: string;
  contentHtml: string;
  publishedAt: string | null;
  publishedAtLabel: string | null;
  exists: boolean;
};

export type PolicyFooterLinkProps = {
  className?: string;
  label?: string;
  apiPath: string;
  pageHref: string;
  title: string;
  modalEyebrow?: string;
  loadingMessage: string;
  emptyMessageHtml: string;
};

function shouldUseDirectNavigation() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(pointer: coarse), (hover: none), (max-width: 768px)").matches;
}

export default function PolicyFooterLink({
  className = "site-footer-link",
  label,
  apiPath,
  pageHref,
  title,
  modalEyebrow,
  loadingMessage,
  emptyMessageHtml,
}: PolicyFooterLinkProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<PolicySnapshot | null>(null);
  const [useDirectNavigation, setUseDirectNavigation] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setUseDirectNavigation(shouldUseDirectNavigation());

    const mediaQuery = window.matchMedia("(pointer: coarse), (hover: none), (max-width: 768px)");
    const handleChange = () => {
      setUseDirectNavigation(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
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

  const loadPolicy = async () => {
    if (policy || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(apiPath, { cache: "no-store" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.details || data?.error || `Failed to load ${title}.`);
      }

      setPolicy(data.version as PolicySnapshot);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError instanceof Error ? loadError.message : `Failed to load ${title}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    await loadPolicy();
  };

  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (
      useDirectNavigation ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    void handleOpen();
  };

  return (
    <>
      <Link
        href={pageHref}
        className={`terms-link-trigger ${className}`}
        onClick={handleClick}
        aria-haspopup={useDirectNavigation ? undefined : "dialog"}
        aria-expanded={useDirectNavigation ? undefined : isOpen}
      >
        {label ?? title}
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
                aria-label={`Close ${title} dialog`}
              >
                <FiX aria-hidden="true" />
              </button>

              <div className="terms-modal-frame">
                <div className="terms-modal-header">
                  <div className="terms-modal-copy">
                    <p className="terms-modal-eyebrow">{modalEyebrow ?? title}</p>
                    <h2 id="terms-modal-title" className="terms-modal-title">
                      {policy?.title ?? title}
                    </h2>
                    <p className="terms-modal-subtitle">
                      {policy?.publishedAt ? (
                        <>
                          Last updated{" "}
                          <LocalTimeText
                            value={policy.publishedAt}
                            options={{ year: "numeric", month: "long", day: "numeric" }}
                          />
                          .
                        </>
                      ) : (
                        `Preview the latest published ${title.toLowerCase()}.`
                      )}
                    </p>
                  </div>

                  <Link href={pageHref} className="terms-modal-page-link" onClick={() => setIsOpen(false)}>
                    <span>Open full page</span>
                    <FiExternalLink aria-hidden="true" />
                  </Link>
                </div>

                <div className="terms-modal-body">
                  {isLoading ? (
                    <div className="terms-modal-empty-state">
                      <FiLoader className="terms-modal-spinner" aria-hidden="true" />
                      <span>{loadingMessage}</span>
                    </div>
                  ) : error ? (
                    <div className="terms-modal-empty-state terms-modal-empty-state-error">
                      <span>{error}</span>
                    </div>
                  ) : (
                    <div
                      className="terms-modal-content news-article-body"
                      dangerouslySetInnerHTML={{
                        __html: policy?.contentHtml ?? emptyMessageHtml,
                      }}
                    />
                  )}
                </div>

                <div className="terms-modal-footer">
                  <Link href={pageHref} className="terms-modal-inline-link" onClick={() => setIsOpen(false)}>
                    <span>{`Review the full ${title} page`}</span>
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