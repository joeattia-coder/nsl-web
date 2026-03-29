"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./LiveMatchesCarousel.module.css";

export type LiveCarouselMatch = {
  id: string;
  href: string;
  eventLabel: string;
  homeName: string;
  awayName: string;
  homeScore: number | string | null;
  awayScore: number | string | null;
  currentFrameNumber: number | null;
  currentFrameHomePoints: number | null;
  currentFrameAwayPoints: number | null;
};

type LiveMatchesCarouselProps = {
  matches: LiveCarouselMatch[];
  className?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
};

function formatScore(value: number | string | null) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "0";
}

export default function LiveMatchesCarousel({
  matches,
  className,
  eyebrow = "Live Now",
  title = "Find active tables fast",
  body = "Every live-scored match is collected here with direct access to its dedicated public live view.",
}: LiveMatchesCarouselProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const element = rowRef.current;
    if (!element || matches.length === 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const epsilon = 2;

    const updateScrollState = () => {
      const max = element.scrollWidth - element.clientWidth;

      if (max <= 1) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      setCanScrollLeft(element.scrollLeft > epsilon);
      setCanScrollRight(element.scrollLeft < max - epsilon);
    };

    element.scrollLeft = 0;
    updateScrollState();
    requestAnimationFrame(updateScrollState);
    const timeoutA = window.setTimeout(updateScrollState, 250);
    const timeoutB = window.setTimeout(updateScrollState, 850);

    element.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.clearTimeout(timeoutA);
      window.clearTimeout(timeoutB);
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [matches.length]);

  if (matches.length === 0) {
    return null;
  }

  const scrollMatches = (direction: "left" | "right") => {
    const element = rowRef.current;
    if (!element) {
      return;
    }

    const amount = Math.round(element.clientWidth * 0.9);
    element.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className={[styles.panel, className].filter(Boolean).join(" ")}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.body}>{body}</p>
        </div>
        <p className={styles.meta}>{matches.length} live matches</p>
      </div>

      <div className={styles.shell}>
        {canScrollLeft ? (
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => scrollMatches("left")}
            aria-label="Scroll live matches left"
            type="button"
          >
            <FiChevronLeft size={20} />
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => scrollMatches("right")}
            aria-label="Scroll live matches right"
            type="button"
          >
            <FiChevronRight size={20} />
          </button>
        ) : null}

        <div className={styles.scroller} ref={rowRef}>
          {matches.map((match) => (
            <article key={`live-${match.id}`} className={styles.card}>
              <div className={styles.top}>
                <span className={styles.badge}>Live</span>
                <span className={styles.cardMeta}>{match.eventLabel || "Published fixture"}</span>
              </div>
              <div className={styles.names}>
                <strong>{match.homeName}</strong>
                <span className={styles.versus}>vs</span>
                <strong>{match.awayName}</strong>
              </div>
              <div className={styles.score}>{`${formatScore(match.homeScore)} - ${formatScore(match.awayScore)}`}</div>
              <div className={styles.subline}>
                <span>{match.currentFrameNumber ? `Frame ${match.currentFrameNumber}` : "Awaiting first frame"}</span>
                <span>
                  {match.currentFrameHomePoints !== null || match.currentFrameAwayPoints !== null
                    ? `${match.currentFrameHomePoints ?? 0} - ${match.currentFrameAwayPoints ?? 0} pts`
                    : "No point score yet"}
                </span>
              </div>
              <Link href={match.href} className={styles.cta}>
                Open Live Match
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
