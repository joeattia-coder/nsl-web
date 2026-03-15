"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiUser, FiChevronLeft, FiChevronRight } from "react-icons/fi";

type AnyObj = Record<string, any>;

type UiMatch = {
  id: string;
  time: string;
  dateLabel: string;
  event: string;
  round: string;
  home: string;
  away: string;
  homeCountryCode: string;
  awayCountryCode: string;
  ctaHref?: string;
};

function firstString(obj: AnyObj, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return fallback;
}

function parseDateLabel(raw: string): string {
  // Attempt to create a simple "DD Mon" label
  // Works for ISO strings, "YYYY-MM-DD", etc. Falls back to raw.
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw || "";
  const day = d.getDate();
  const mon = d.toLocaleString(undefined, { month: "short" });
  return `${day} ${mon}`;
}

function parseTimeLabel(raw: string): string {
  // If already "19:30" keep it. If ISO, format HH:MM.
  if (!raw) return "";
  if (/^\d{1,2}:\d{2}$/.test(raw.trim())) return raw.trim();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function toUiMatch(fx: AnyObj, idx: number): UiMatch {
  const id =
    firstString(fx, ["FixtureID", "fixtureID", "fixtureId", "ID", "Id"], "") ||
    `fx-${idx}`;

  const home = firstString(fx, ["HomeTeamName", "homeTeamName", "HomeTeam", "homeTeam"], "Home");
  const away = firstString(fx, ["RoadTeamName", "roadTeamName", "AwayTeamName", "awayTeamName"],
  "Away");

  const event = firstString(
    fx,
    ["fixtureGroupDesc", "competitionName", "EventName", "eventName", "LeagueName", "leagueName"],
    "National League"
  );

  const round = firstString(
    fx,
    ["RoundName", "roundName", "FixtureGroupName", "fixtureGroupName", "StageName", "stageName"],
    ""
  );

  // Date/time fields vary. Try common ones.
  const rawDate =
    firstString(fx, ["FixtureDate", "fixtureDate", "Date", "date", "StartDate", "startDate"], "") ||
    "";
  const rawTime =
    firstString(fx, ["FixtureTime", "fixtureTime", "Time", "time", "StartTime", "startTime"], "") ||
    "";

  // Sometimes LR uses a combined datetime
  const rawDateTime = firstString(
    fx,
    ["FixtureDateTime", "fixtureDateTime", "StartDateTime", "startDateTime", "DateTime", "dateTime"],
    ""
  );

  const dateLabel = rawDateTime ? parseDateLabel(rawDateTime) : parseDateLabel(rawDate);
  const time = rawDateTime ? parseTimeLabel(rawDateTime) : parseTimeLabel(rawTime);

  // Optional: link to match centre if LR provides it
  const ctaHref = firstString(
    fx,
    ["MatchCentreUrl", "matchCentreUrl", "FixtureUrl", "fixtureUrl", "URL", "Url"],
    ""
  ) || undefined;

  return {
    id,
    time: time || "TBA",
    dateLabel: dateLabel || "",
    event,
    round: round || "",
    home,
    away,
    homeCountryCode: firstString(fx, ["homeCountryCode", "HomeCountryCode"], ""),
    awayCountryCode: firstString(fx, ["roadCountryCode", "RoadCountryCode"], ""),
    ctaHref,
  };
}

export default function Page() {
  const videoRowRef = useRef<HTMLDivElement | null>(null);
  const matchesRowRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [canScrollMatchesLeft, setCanScrollMatchesLeft] = useState(false);
  const [canScrollMatchesRight, setCanScrollMatchesRight] = useState(false);

  const [fixturesRaw, setFixturesRaw] = useState<AnyObj[] | null>(null);
  const [fixturesError, setFixturesError] = useState<string>("");

  const EPS = 2;

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/fixtures")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data?.error || `Request failed (${r.status})`);
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data?.fixtures) ? data.fixtures : [];
        setFixturesRaw(arr);
        setFixturesError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setFixturesRaw([]);
        setFixturesError(err?.message || "Failed to load fixtures");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const matches: UiMatch[] = useMemo(() => {
    const arr = fixturesRaw ?? [];
    // Pick a reasonable number to show in the carousel
    return arr.slice(0, 12).map(toUiMatch);
  }, [fixturesRaw]);

  // VIDEO CAROUSEL ARROWS
  useEffect(() => {
    const el = videoRowRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;

      if (max <= 1) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      setCanScrollLeft(el.scrollLeft > EPS);
      setCanScrollRight(el.scrollLeft < max - EPS);
    };

    update();
    requestAnimationFrame(update);
    const t1 = window.setTimeout(update, 300);
    const t2 = window.setTimeout(update, 900);

    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollVideos = (direction: "left" | "right") => {
    const el = videoRowRef.current;
    if (!el) return;

    const firstCard = el.querySelector<HTMLElement>(".video-card");
    const cardWidth = firstCard?.offsetWidth ?? Math.round(el.clientWidth * 0.9);

    const styles = window.getComputedStyle(el);
    const gapStr = (styles.columnGap || styles.gap || "0px").toString();
    const gap = parseFloat(gapStr) || 0;

    const step = cardWidth + gap;

    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });

    requestAnimationFrame(() => {
      const el2 = videoRowRef.current;
      if (!el2) return;
      const max = el2.scrollWidth - el2.clientWidth;
      setCanScrollLeft(el2.scrollLeft > EPS);
      setCanScrollRight(el2.scrollLeft < max - EPS);
    });

    window.setTimeout(() => {
      const el2 = videoRowRef.current;
      if (!el2) return;
      const max = el2.scrollWidth - el2.clientWidth;
      setCanScrollLeft(el2.scrollLeft > EPS);
      setCanScrollRight(el2.scrollLeft < max - EPS);
    }, 350);
  };

  // MATCHES CAROUSEL ARROWS
  useEffect(() => {
    const el = matchesRowRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;

      if (max <= 1) {
        setCanScrollMatchesLeft(false);
        setCanScrollMatchesRight(false);
        return;
      }

      setCanScrollMatchesLeft(el.scrollLeft > 2);
      setCanScrollMatchesRight(el.scrollLeft < max - 2);
    };

    update();
    requestAnimationFrame(update);
    const t1 = window.setTimeout(update, 300);
    const t2 = window.setTimeout(update, 900);

    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [matches.length]); // re-run when list changes

  const scrollMatches = (direction: "left" | "right") => {
    const el = matchesRowRef.current;
    if (!el) return;

    const firstCard = el.querySelector<HTMLElement>(".match-card");
    const cardWidth = firstCard?.offsetWidth ?? 420;
    const gap = 18;
    const step = cardWidth + gap;

    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <main className="content">
      {/* Hero */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>The National Snooker League</h1>
            <p>Your professional snooker platform.</p>

            <div className="hero-actions">
              <a className="hero-btn primary" href="#">
                View Matches
              </a>
              <a className="hero-btn ghost" href="#">
                Rankings
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Live & Upcoming Matches */}
      <section className="matches-section">
        <div className="section-header">
          <h2 className="section-heading">Live and Upcoming Matches</h2>

          <Link href="/matches" className="view-all-link">
            View All Matches →
          </Link>
        </div>

        {fixturesError && (
          <div style={{ marginBottom: 12, opacity: 0.9 }}>
            Failed to load fixtures: {fixturesError}
          </div>
        )}

        {!fixturesError && fixturesRaw === null && (
          <div style={{ marginBottom: 12, opacity: 0.9 }}>
            Loading fixtures…
          </div>
        )}

        <div className="matches-carousel-wrapper">
          {canScrollMatchesLeft && (
            <button
              className="carousel-arrow left"
              onClick={() => scrollMatches("left")}
              aria-label="Scroll matches left"
              type="button"
            >
              <FiChevronLeft size={24} style={{ stroke: "#fff" }} />
            </button>
          )}

          {canScrollMatchesRight && (
            <button
              className="carousel-arrow right"
              onClick={() => scrollMatches("right")}
              aria-label="Scroll matches right"
              type="button"
            >
              <FiChevronRight size={24} style={{ stroke: "#fff" }} />
            </button>
          )}

          <div className="matches-row" ref={matchesRowRef}>
            {matches.map((m) => (
              <div className="match-card" key={m.id}>
                <div className="match-meta-top">
                  <div className="match-datetime">
                    <div className="match-time">{m.time}</div>
                    <div className="match-date">{m.dateLabel}</div>
                  </div>

                  <div className="match-competition">
                    <div className="match-event">{m.event}</div>
                    <div className="match-round">{m.round}</div>
                  </div>
                </div>

                <div className="match-vs">
                  <div className="player">
                    <div className="player-avatar icon">
                      <FiUser size={28} />
                    </div>
                    <div className="player-copy">
                      <div className="player-name">{m.home}</div>
                      {m.homeCountryCode ? (
                        <div className="player-flag-row">
                          <img
                            src={`https://flagcdn.com/w40/${m.homeCountryCode.toLowerCase()}.png`}
                            alt={m.homeCountryCode}
                            className="player-flag-img"
                            title={m.homeCountryCode}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="match-pill">{m.time}</div>

                  <div className="player right">
                    <div className="player-copy player-copy-right">
                      <div className="player-name right">{m.away}</div>
                      {m.awayCountryCode ? (
                        <div className="player-flag-row player-flag-row-right">
                          <img
                            src={`https://flagcdn.com/w40/${m.awayCountryCode.toLowerCase()}.png`}
                            alt={m.awayCountryCode}
                            className="player-flag-img"
                            title={m.awayCountryCode}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="player-avatar icon">
                      <FiUser size={28} />
                    </div>
                  </div>
                </div>

                {m.ctaHref ? (
                  <a className="match-cta" href={m.ctaHref} target="_blank" rel="noopener noreferrer">
                    Match Centre
                  </a>
                ) : (
                  <button className="match-cta" type="button">
                    Match Centre
                  </button>
                )}
              </div>
            ))}

            {fixturesRaw !== null && matches.length === 0 && (
              <div style={{ padding: 12, opacity: 0.9 }}>
                No matches available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Video Highlights */}
      <div className="video-section">
        <h2 className="video-heading">Latest Video Highlights</h2>

        <div className="video-carousel-wrapper">
          {canScrollLeft && (
            <button
              className="carousel-arrow left"
              onClick={() => scrollVideos("left")}
              aria-label="Scroll videos left"
              type="button"
            >
              <FiChevronLeft size={24} style={{ stroke: "#fff" }} />
            </button>
          )}

          {canScrollRight && (
            <button
              className="carousel-arrow right"
              onClick={() => scrollVideos("right")}
              aria-label="Scroll videos right"
              type="button"
            >
              <FiChevronRight size={24} style={{ stroke: "#fff" }} />
            </button>
          )}

          <div className="video-carousel" ref={videoRowRef}>
            <div className="video-card">
              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/kjQWAElNfpY?si=qTKOVVMLeyWVOu4X"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>

              <a
                className="video-title-link"
                href="https://www.youtube.com/watch?v=kjQWAElNfpY"
                target="_blank"
                rel="noopener noreferrer"
              >
                EPIC FINISH! Ronnie O&apos;Sullivan vs Kyren Wilson Delivers The
                Goods | Saudi Arabia Snooker Masters
              </a>
            </div>

            <div className="video-card">
              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/yg-DU7by4v8?si=JxlpEvO4FEAWPjy1"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>

              <a
                className="video-title-link"
                href="https://www.youtube.com/watch?v=yg-DU7by4v8"
                target="_blank"
                rel="noopener noreferrer"
              >
                EPIC FINISH! Ronnie O&apos;Sullivan vs Kyren Wilson Delivers The
                Goods | Saudi Arabia Snooker Masters
              </a>
            </div>

            <div className="video-card">
              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/ypuVCLn0H5Q?si=r-4t2whinc8lsUXj"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>

              <a
                className="video-title-link"
                href="https://www.youtube.com/watch?v=ypuVCLn0H5Q"
                target="_blank"
                rel="noopener noreferrer"
              >
                BOTH 147s! Ronnie O&apos;Sullivan&apos;s TWO MAXIMUMS In Same
                Match vs Wakelin | Saudi Arabia Snooker Masters
              </a>
            </div>

            <div className="video-card">
              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/kjQWAElNfpY?si=qTKOVVMLeyWVOu4X"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>

              <a
                className="video-title-link"
                href="https://www.youtube.com/watch?v=kjQWAElNfpY"
                target="_blank"
                rel="noopener noreferrer"
              >
                EPIC FINISH! Ronnie O&apos;Sullivan vs Kyren Wilson Delivers The
                Goods | Saudi Arabia Snooker Masters
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}