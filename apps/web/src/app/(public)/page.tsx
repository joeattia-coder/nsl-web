"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiUser, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getFlagCdnUrl } from "@/lib/country";

type AnyObj = Record<string, unknown>;

type UiMatch = {
  id: string;
  time: string;
  scoreLabel: string;
  dateLabel: string;
  event: string;
  round: string;
  home: string;
  away: string;
  homePlayerId: string | null;
  awayPlayerId: string | null;
  homeCountryCode: string;
  awayCountryCode: string;
  homePlayerPhotoUrl: string;
  awayPlayerPhotoUrl: string;
};

const HOMEPAGE_MATCH_LIMIT = 12;
const HOMEPAGE_MATCH_MINIMUM = 8;

type HomeVideoHighlight = {
  id: string;
  title: string;
  sourceType: "YOUTUBE" | "UPLOAD";
  embedUrl: string;
  watchUrl: string;
};

type HomeNewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  homePlacement?: "SCROLLING_BANNER" | "NEWS_SECTION" | null;
  homeDisplayMode?: "THUMBNAIL" | "TITLE" | "THUMBNAIL_TITLE" | null;
  homeSortOrder?: number;
  publishedAt?: string | null;
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

function firstNumber(obj: AnyObj, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const parsed = Number(v);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function formatScoreLabel(homeScore: number | null, awayScore: number | null): string {
  if (homeScore !== null && awayScore !== null) {
    return `${homeScore} - ${awayScore}`;
  }

  return "VS";
}

function splitPlayerName(fullName: string): { first: string; last: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { first: "", last: "" };
  }

  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }

  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
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
  const homeScore = firstNumber(fx, ["homeScore", "HomeScore", "HomeTeamScore"]);
  const awayScore = firstNumber(fx, ["roadScore", "RoadScore", "AwayScore", "RoadTeamScore"]);

  return {
    id,
    time: time || "TBA",
    scoreLabel: formatScoreLabel(homeScore, awayScore),
    dateLabel: dateLabel || "",
    event,
    round: round || "",
    home,
    away,
    homePlayerId: firstString(fx, ["homePlayerId", "HomePlayerId"], "") || null,
    awayPlayerId: firstString(fx, ["roadPlayerId", "RoadPlayerId"], "") || null,
    homeCountryCode: firstString(fx, ["homeCountryCode", "HomeCountryCode"], ""),
    awayCountryCode: firstString(fx, ["roadCountryCode", "RoadCountryCode"], ""),
    homePlayerPhotoUrl: firstString(fx, ["homePlayerPhotoUrl", "HomePlayerPhotoUrl"], ""),
    awayPlayerPhotoUrl: firstString(fx, ["roadPlayerPhotoUrl", "RoadPlayerPhotoUrl"], ""),
  };
}

function getFixtureMatchStatus(fx: AnyObj): string {
  return firstString(fx, ["matchStatus", "MatchStatus"], "").toUpperCase();
}

function getFixtureTournamentKey(fx: AnyObj, idx: number): string {
  return (
    firstString(fx, ["fixtureGroupIdentifier", "FixtureGroupIdentifier", "tournamentId"], "") ||
    firstString(fx, ["fixtureGroupDesc", "FixtureGroupDesc", "tournamentName"], "") ||
    `tournament-${idx}`
  );
}

function getFixtureDateTimestamp(fx: AnyObj): number | null {
  const rawDateTime = firstString(
    fx,
    ["FixtureDateTime", "fixtureDateTime", "StartDateTime", "startDateTime", "DateTime", "dateTime"],
    ""
  );

  if (rawDateTime) {
    const parsedDateTime = new Date(rawDateTime);
    if (!Number.isNaN(parsedDateTime.getTime())) {
      return parsedDateTime.getTime();
    }
  }

  const rawDate = firstString(
    fx,
    ["FixtureDate", "fixtureDate", "Date", "date", "StartDate", "startDate"],
    ""
  );

  if (!rawDate) {
    return null;
  }

  const parsedDate = new Date(rawDate);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getTime();
  }

  return null;
}

function isCompletedFixture(fx: AnyObj): boolean {
  const matchStatus = getFixtureMatchStatus(fx);

  if (matchStatus === "COMPLETED") {
    return true;
  }

  const homeScore = firstNumber(fx, ["homeScore", "HomeScore", "HomeTeamScore"]);
  const awayScore = firstNumber(fx, ["roadScore", "RoadScore", "AwayScore", "RoadTeamScore"]);

  return homeScore !== null && awayScore !== null;
}

function getFixtureStableOrderScore(fx: AnyObj, idx: number) {
  const seed = `${firstString(fx, ["FixtureID", "fixtureID", "fixtureId", "ID", "Id"], `fixture-${idx}`)}:${getFixtureTournamentKey(fx, idx)}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickRandomFixturesFromDifferentTournaments(
  fixtures: Array<{ fixture: AnyObj; index: number }>,
  limit = HOMEPAGE_MATCH_LIMIT
) {
  const shuffled = [...fixtures].sort((left, right) => {
    const leftScore = getFixtureStableOrderScore(left.fixture, left.index);
    const rightScore = getFixtureStableOrderScore(right.fixture, right.index);

    if (leftScore === rightScore) {
      return left.index - right.index;
    }

    return leftScore - rightScore;
  });
  const tournamentKeys = new Set<string>();
  const selected: Array<{ fixture: AnyObj; index: number }> = [];

  for (const entry of shuffled) {
    const tournamentKey = getFixtureTournamentKey(entry.fixture, entry.index);
    if (tournamentKeys.has(tournamentKey)) {
      continue;
    }

    tournamentKeys.add(tournamentKey);
    selected.push(entry);

    if (selected.length >= limit) {
      return selected;
    }
  }

  for (const entry of shuffled) {
    if (selected.some((selectedEntry) => selectedEntry.index === entry.index)) {
      continue;
    }

    selected.push(entry);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

export default function Page() {
  const newsRowRef = useRef<HTMLDivElement | null>(null);
  const videoRowRef = useRef<HTMLDivElement | null>(null);
  const matchesRowRef = useRef<HTMLDivElement | null>(null);

  const [canScrollNewsLeft, setCanScrollNewsLeft] = useState(false);
  const [canScrollNewsRight, setCanScrollNewsRight] = useState(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [canScrollMatchesLeft, setCanScrollMatchesLeft] = useState(false);
  const [canScrollMatchesRight, setCanScrollMatchesRight] = useState(false);

  const [fixturesRaw, setFixturesRaw] = useState<AnyObj[] | null>(null);
  const [fixturesError, setFixturesError] = useState<string>("");
  const [featuredNews, setFeaturedNews] = useState<HomeNewsArticle[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<HomeVideoHighlight[]>([]);

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

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/videos?limit=12")
      .then(async (response) => {
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || `Video request failed (${response.status})`);
        }

        if (cancelled) return;
        setFeaturedVideos(Array.isArray(data?.videos) ? data.videos : []);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load homepage videos:", error);
        setFeaturedVideos([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/news?placement=NEWS_SECTION&limit=10")
      .then(async (response) => {
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || `News request failed (${response.status})`);
        }

        if (cancelled) return;
        setFeaturedNews(Array.isArray(data?.articles) ? data.articles : []);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load homepage news:", error);
        setFeaturedNews([]);
      });

    return () => {
      cancelled = true;
    };
  }, [featuredVideos.length]);

  const matches: UiMatch[] = useMemo(() => {
    const incompleteFixtures = (fixturesRaw ?? [])
      .map((fixture, index) => ({ fixture, index }))
      .filter(({ fixture }) => !isCompletedFixture(fixture));

    const incompleteFixturesWithDates = incompleteFixtures
      .map((entry) => ({
        ...entry,
        timestamp: getFixtureDateTimestamp(entry.fixture),
      }))
      .filter((entry): entry is typeof entry & { timestamp: number } => entry.timestamp !== null)
      .sort((left, right) => left.timestamp - right.timestamp);

    const datedSelections = incompleteFixturesWithDates.slice(0, HOMEPAGE_MATCH_LIMIT);

    if (datedSelections.length >= HOMEPAGE_MATCH_MINIMUM) {
      return datedSelections.map(({ fixture, index }) => toUiMatch(fixture, index));
    }

    const selectedFixtureIndexes = new Set(datedSelections.map(({ index }) => index));
    const remainingFixtures = incompleteFixtures.filter(
      ({ index }) => !selectedFixtureIndexes.has(index)
    );
    const additionalFixturesNeeded = Math.min(
      HOMEPAGE_MATCH_LIMIT - datedSelections.length,
      Math.max(HOMEPAGE_MATCH_MINIMUM - datedSelections.length, 0)
    );

    return [...datedSelections, ...pickRandomFixturesFromDifferentTournaments(remainingFixtures, additionalFixturesNeeded)]
      .map(({ fixture, index }) => toUiMatch(fixture, index));
  }, [fixturesRaw]);

  // FEATURED NEWS CAROUSEL ARROWS
  useEffect(() => {
    const el = newsRowRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;

      if (max <= 1) {
        setCanScrollNewsLeft(false);
        setCanScrollNewsRight(false);
        return;
      }

      setCanScrollNewsLeft(el.scrollLeft > EPS);
      setCanScrollNewsRight(el.scrollLeft < max - EPS);
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
  }, [featuredNews.length]);

  const scrollNews = (direction: "left" | "right") => {
    const el = newsRowRef.current;
    if (!el) return;

    const firstCard = el.querySelector<HTMLElement>(".featured-news-card");
    const cardWidth = firstCard?.offsetWidth ?? 360;
    const gap = 18;
    const step = cardWidth + gap;

    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

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
              <Link className="hero-btn primary" href="/matches">
                View Matches
              </Link>
              <Link className="hero-btn ghost" href="/rankings">
                Rankings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {featuredNews.length > 0 ? (
        <section className="featured-news-section">
          <div className="section-header">
            <h2 className="section-heading">Featured Matches and News</h2>

            <Link href="/news" className="view-all-link">
              View All News →
            </Link>
          </div>

          <div className="featured-news-carousel-wrapper">
            {canScrollNewsLeft && (
              <button
                className="carousel-arrow left"
                onClick={() => scrollNews("left")}
                aria-label="Scroll featured news left"
                type="button"
              >
                <FiChevronLeft size={24} style={{ stroke: "#fff" }} />
              </button>
            )}

            {canScrollNewsRight && (
              <button
                className="carousel-arrow right"
                onClick={() => scrollNews("right")}
                aria-label="Scroll featured news right"
                type="button"
              >
                <FiChevronRight size={24} style={{ stroke: "#fff" }} />
              </button>
            )}

            <div className="featured-news-row" ref={newsRowRef}>
              {featuredNews.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="featured-news-card">
                  {article.coverImageUrl ? (
                    <Image
                      src={article.coverImageUrl}
                      alt={article.title}
                      width={640}
                      height={360}
                      className="featured-news-thumbnail"
                      sizes="(max-width: 768px) 100vw, 360px"
                    />
                  ) : (
                    <div className="featured-news-thumbnail featured-news-media-fallback">NSL</div>
                  )}

                  <div className="featured-news-body compact">
                    <h3 className="featured-news-title compact">{article.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Upcoming Matches */}
      <section className="matches-section">
        <div className="section-header">
          <h2 className="section-heading">Upcoming Matches</h2>

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
            {matches.map((m) => {
              const homeName = splitPlayerName(m.home);
              const awayName = splitPlayerName(m.away);

              return (
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
                      {m.homePlayerPhotoUrl ? (
                        <Image
                          src={m.homePlayerPhotoUrl}
                          alt={m.home}
                          width={72}
                          height={72}
                          className="player-avatar-photo"
                        />
                      ) : (
                        <FiUser size={28} />
                      )}
                    </div>
                    <div className="player-copy">
                      {m.homePlayerId ? (
                        <Link className="public-player-link player-name" href={`/players/${m.homePlayerId}`}>
                          <span className="player-name-line">{homeName.first}</span>
                          <span className="player-name-line">{homeName.last}</span>
                        </Link>
                      ) : (
                        <div className="player-name">
                          <span className="player-name-line">{homeName.first}</span>
                          <span className="player-name-line">{homeName.last}</span>
                        </div>
                      )}
                      {m.homeCountryCode ? (
                        <div className="player-flag-row">
                          <Image
                            src={getFlagCdnUrl(m.homeCountryCode, "w40") ?? ""}
                            alt={m.homeCountryCode}
                            width={40}
                            height={30}
                            className="player-flag-img"
                            title={m.homeCountryCode}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="match-pill">{m.scoreLabel}</div>

                  <div className="player right">
                    <div className="player-copy player-copy-right">
                      {m.awayPlayerId ? (
                        <Link className="public-player-link player-name right" href={`/players/${m.awayPlayerId}`}>
                          <span className="player-name-line">{awayName.first}</span>
                          <span className="player-name-line">{awayName.last}</span>
                        </Link>
                      ) : (
                        <div className="player-name right">
                          <span className="player-name-line">{awayName.first}</span>
                          <span className="player-name-line">{awayName.last}</span>
                        </div>
                      )}
                      {m.awayCountryCode ? (
                        <div className="player-flag-row player-flag-row-right">
                          <Image
                            src={getFlagCdnUrl(m.awayCountryCode, "w40") ?? ""}
                            alt={m.awayCountryCode}
                            width={40}
                            height={30}
                            className="player-flag-img"
                            title={m.awayCountryCode}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="player-avatar icon">
                      {m.awayPlayerPhotoUrl ? (
                        <Image
                          src={m.awayPlayerPhotoUrl}
                          alt={m.away}
                          width={72}
                          height={72}
                          className="player-avatar-photo"
                        />
                      ) : (
                        <FiUser size={28} />
                      )}
                    </div>
                  </div>
                </div>

                <Link className="match-cta" href={`/matches/${m.id}`}>
                  Match Centre
                </Link>
              </div>
              );
            })}

            {fixturesRaw !== null && matches.length === 0 && (
              <div style={{ padding: 12, opacity: 0.9 }}>
                No matches available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Video Highlights */}
      {featuredVideos.length > 0 ? (
        <div className="video-section">
          <div className="section-header">
            <h2 className="video-heading">Latest Video Highlights</h2>
          </div>

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
              {featuredVideos.map((video) => (
                <div className="video-card" key={video.id}>
                  <div className="video-container">
                    {video.sourceType === "YOUTUBE" ? (
                      <iframe
                        src={video.embedUrl}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video controls preload="metadata" playsInline>
                        <source src={video.embedUrl} />
                      </video>
                    )}
                  </div>

                  <a
                    className="video-title-link"
                    href={video.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {video.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}