"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiPlayCircle,
} from "react-icons/fi";
import LiveMatchesCarousel, { type LiveCarouselMatch } from "@/components/public/LiveMatchesCarousel";
import { KnockoutBracket } from "@/components/tournament-bracket/KnockoutBracket";
import type { BracketRound } from "@/components/tournament-bracket/types";
import { getFlagCdnUrl } from "@/lib/country";
import type { PublicLiveMatchListResponse, PublicLiveMatchSnapshot } from "@/lib/live-match";
import { formatDateInAdminTimeZone } from "@/lib/timezone";
import { useLivePolling } from "@/lib/useLivePolling";
import styles from "./MatchesPage.module.css";

type AnyObj = Record<string, unknown>;

type ApiErrorResponse = {
  error?: string;
};

type AsyncGroupData<T> = {
  key: string;
  data: T | null;
  error: string;
};

type UiGroup = {
  id: string;
  desc: string;
};

type NameParts = { first: string; last: string };

type UiMatch = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  matchStatus: string;
  liveSessionStatus: string | null;
  currentFrameNumber: number | null;
  currentFrameHomePoints: number | null;
  currentFrameAwayPoints: number | null;
  activeSide: "home" | "away" | null;
  publicNote: string | null;
  updatedAt: string | null;

  homeName: string;
  roadName: string;
  homePlayerId: string | null;
  roadPlayerId: string | null;
  homeCountryCode: string;
  roadCountryCode: string;
  roundType: string;

  homeParts: NameParts;
  roadParts: NameParts;

  homeScore: string;
  roadScore: string;
  homePlayerPhotoUrl: string;
  roadPlayerPhotoUrl: string;

  fixtureGroupDesc: string;
  roundDesc: string;

  fixtureGroupId: string;
};

type StandingsRow = {
  rank: number;
  teamName: string;
  playerId?: string | null;
  played: number;
  won: number;
  tied?: number;
  lost: number;
  diff: number;
  points: number;
  framesFor?: number;
  framesAgainst?: number;
  recentForm?: string;
};

type StandingsGroup = {
  standingsDesc: string;
  count: number;
  rows: StandingsRow[];
};

type StandingsApiResponse = {
  fixtureTypeID: number;
  fixtureGroupIdentifier: string;
  groupCount: number;
  groups: StandingsGroup[];
};

type KnockoutBracketResponse = {
  fixtureGroupIdentifier: string;
  entrantsCount: number;
  bracketSize: number;
  sourceRoundName: string;
  rounds: BracketRound[];
};

function firstString(obj: AnyObj, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return fallback;
}

function splitName(full: string): NameParts {
  const cleaned = (full || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { first: "", last: "" };

  const parts = cleaned.split(" ");
  if (parts.length === 1) return { first: "", last: parts[0] };

  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return { first, last };
}

function parseLRDateTime(raw: string): Date | null {
  const s = (raw || "").trim();
  const m = s.match(/^(\d{4})(\d{2})(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);

  const d = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateLabel(d: Date): string {
  const day = formatDateInAdminTimeZone(d, { day: "numeric" });
  const mon = formatDateInAdminTimeZone(d, { month: "short" });
  return `${day} ${mon}`;
}

function formatTimeLabel(d: Date): string {
  return formatDateInAdminTimeZone(d, { hour: "2-digit", minute: "2-digit" });
}

function toUiGroup(g: AnyObj, idx: number): UiGroup {
  const id =
    firstString(
      g,
      ["fixtureGroupIdentifier", "FixtureGroupIdentifier", "Identifier", "identifier"],
      ""
    ) || `group-${idx}`;

  const desc = firstString(
    g,
    ["FixtureGroupDesc", "fixtureGroupDesc", "Description", "description"],
    ""
  );

  return { id, desc };
}

function toUiMatch(fx: AnyObj, idx: number): UiMatch {
  const id = String(fx?.fixtureId ?? fx?.FixtureID ?? `fx-${idx}`);

  const homeName = firstString(fx, ["homeTeamName", "HomeTeamName"], "Home");
  const roadName = firstString(fx, ["roadTeamName", "RoadTeamName"], "Away");

  const homeParts = splitName(homeName);
  const roadParts = splitName(roadName);

  const fixtureGroupDesc = firstString(fx, ["fixtureGroupDesc", "FixtureGroupDesc"], "");
  const roundDesc = firstString(fx, ["roundDesc", "RoundDesc"], "");

  const groupIdRaw = fx?.fixtureGroupIdentifier ?? fx?.FixtureGroupIdentifier;
  const fixtureGroupId = groupIdRaw === null || groupIdRaw === undefined ? "" : String(groupIdRaw);

  const rawFixtureDate = firstString(fx, ["fixtureDate", "FixtureDate"], "");
  const dt = parseLRDateTime(rawFixtureDate);

  const dateLabel = dt ? formatDateLabel(dt) : "";
  const timeLabel = dt ? formatTimeLabel(dt) : "TBA";

  const homeScoreVal = fx?.homeScore ?? fx?.HomeScore ?? fx?.HomeTeamScore ?? null;
  const roadScoreVal = fx?.roadScore ?? fx?.RoadScore ?? fx?.RoadTeamScore ?? null;

  const homeScore = homeScoreVal === null || homeScoreVal === undefined ? "" : String(homeScoreVal);
  const roadScore = roadScoreVal === null || roadScoreVal === undefined ? "" : String(roadScoreVal);
  const homePlayerPhotoUrl = firstString(fx, ["homePlayerPhotoUrl", "HomePlayerPhotoUrl"], "");
  const roadPlayerPhotoUrl = firstString(fx, ["roadPlayerPhotoUrl", "RoadPlayerPhotoUrl"], "");
  const matchStatus = firstString(fx, ["matchStatus", "MatchStatus"], "SCHEDULED");
  const liveSessionStatusRaw = fx?.liveSessionStatus ?? fx?.LiveSessionStatus ?? null;
  const liveSessionStatus = typeof liveSessionStatusRaw === "string" ? liveSessionStatusRaw : null;
  const currentFrameNumber = typeof fx?.currentFrameNumber === "number" ? fx.currentFrameNumber : null;
  const currentFrameHomePoints = typeof fx?.currentFrameHomePoints === "number" ? fx.currentFrameHomePoints : null;
  const currentFrameAwayPoints = typeof fx?.currentFrameAwayPoints === "number" ? fx.currentFrameAwayPoints : null;
  const activeSideRaw = fx?.activeSide ?? null;
  const activeSide = activeSideRaw === "home" || activeSideRaw === "away" ? activeSideRaw : null;
  const publicNote = typeof fx?.publicNote === "string" ? fx.publicNote : null;
  const updatedAt = typeof fx?.updatedAt === "string" ? fx.updatedAt : null;

  return {
    id,
    dateLabel: dateLabel || (rawFixtureDate ? rawFixtureDate : ""),
    timeLabel,
    matchStatus,
    liveSessionStatus,
    currentFrameNumber,
    currentFrameHomePoints,
    currentFrameAwayPoints,
    activeSide,
    publicNote,
    updatedAt,
    homeName,
    roadName,
    homePlayerId: firstString(fx, ["homePlayerId", "HomePlayerId"], "") || null,
    roadPlayerId: firstString(fx, ["roadPlayerId", "RoadPlayerId"], "") || null,
    homeCountryCode: firstString(fx, ["homeCountryCode", "HomeCountryCode"], ""),
    roadCountryCode: firstString(fx, ["roadCountryCode", "RoadCountryCode"], ""),
    roundType: firstString(fx, ["roundType", "RoundType"], ""),
    homeParts,
    roadParts,
    homeScore,
    roadScore,
    homePlayerPhotoUrl,
    roadPlayerPhotoUrl,
    fixtureGroupDesc,
    roundDesc,
    fixtureGroupId,
  };
}

function getFixtureIdentity(fx: AnyObj) {
  return firstString(fx, ["fixtureId", "FixtureID", "FixtureId", "id", "ID"], "");
}

function formatStatusLabel(value: string) {
  const source = value.trim() || "SCHEDULED";
  return source
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function applyLiveSnapshots(current: AnyObj[] | null, snapshots: PublicLiveMatchSnapshot[]) {
  if (!current || current.length === 0 || snapshots.length === 0) {
    return current;
  }

  const updates = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  let changed = false;

  const next = current.map((fixture) => {
    const fixtureId = getFixtureIdentity(fixture);
    const snapshot = updates.get(fixtureId);

    if (!snapshot) {
      return fixture;
    }

    const currentHomeScore = fixture.homeScore ?? null;
    const currentAwayScore = fixture.roadScore ?? null;
    const currentMatchStatus = typeof fixture.matchStatus === "string" ? fixture.matchStatus : "";
    const currentScheduleStatus = typeof fixture.scheduleStatus === "string" ? fixture.scheduleStatus : "";
    const currentPublicNote = typeof fixture.publicNote === "string" ? fixture.publicNote : fixture.publicNote ?? null;
    const currentLiveSessionStatus = typeof fixture.liveSessionStatus === "string" ? fixture.liveSessionStatus : fixture.liveSessionStatus ?? null;
    const currentFrameNumber = typeof fixture.currentFrameNumber === "number" ? fixture.currentFrameNumber : null;
    const currentFrameHomePoints = typeof fixture.currentFrameHomePoints === "number" ? fixture.currentFrameHomePoints : null;
    const currentFrameAwayPoints = typeof fixture.currentFrameAwayPoints === "number" ? fixture.currentFrameAwayPoints : null;
    const currentActiveSide = fixture.activeSide === "home" || fixture.activeSide === "away" ? fixture.activeSide : null;
    const currentUpdatedAt = typeof fixture.updatedAt === "string" ? fixture.updatedAt : null;

    if (
      currentHomeScore === snapshot.homeScore &&
      currentAwayScore === snapshot.awayScore &&
      currentMatchStatus === snapshot.matchStatus &&
      currentScheduleStatus === snapshot.scheduleStatus &&
      currentPublicNote === snapshot.publicNote &&
      currentLiveSessionStatus === snapshot.liveSessionStatus &&
      currentFrameNumber === snapshot.currentFrameNumber &&
      currentFrameHomePoints === snapshot.currentFrameHomePoints &&
      currentFrameAwayPoints === snapshot.currentFrameAwayPoints &&
      currentActiveSide === snapshot.activeSide &&
      currentUpdatedAt === snapshot.updatedAt
    ) {
      return fixture;
    }

    changed = true;

    return {
      ...fixture,
      homeScore: snapshot.homeScore,
      roadScore: snapshot.awayScore,
      matchStatus: snapshot.matchStatus,
      scheduleStatus: snapshot.scheduleStatus,
      publicNote: snapshot.publicNote,
      liveSessionStatus: snapshot.liveSessionStatus,
      currentFrameNumber: snapshot.currentFrameNumber,
      currentFrameHomePoints: snapshot.currentFrameHomePoints,
      currentFrameAwayPoints: snapshot.currentFrameAwayPoints,
      activeSide: snapshot.activeSide,
      updatedAt: snapshot.updatedAt,
    };
  });

  return changed ? next : current;
}

export default function MatchesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [groupsRaw, setGroupsRaw] = useState<AnyObj[] | null>(null);
  const [groupsError, setGroupsError] = useState("");

  const [fixturesRaw, setFixturesRaw] = useState<AnyObj[] | null>(null);
  const [fixturesError, setFixturesError] = useState("");

  const [activeTab, setActiveTab] = useState<"matches" | "groups" | "knockout">("matches");

  const groupsRowRef = useRef<HTMLDivElement | null>(null);
  const activeGroupButtonRef = useRef<HTMLButtonElement | null>(null);
  const [canScrollGroupsLeft, setCanScrollGroupsLeft] = useState(false);
  const [canScrollGroupsRight, setCanScrollGroupsRight] = useState(false);

  const [standingsState, setStandingsState] = useState<AsyncGroupData<StandingsGroup[]>>({
    key: "",
    data: null,
    error: "",
  });

  const [knockoutState, setKnockoutState] = useState<AsyncGroupData<KnockoutBracketResponse>>({
    key: "",
    data: null,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/fixture-groups")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const arr = Array.isArray(data?.fixtureGroups) ? data.fixtureGroups : [];
        setGroupsRaw(arr);
        setGroupsError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setGroupsRaw([]);
        setGroupsError(err?.message || "Failed to load fixture groups");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/fixtures")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
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

  const groupIdsWithFixtures = useMemo(() => {
    const s = new Set<string>();
    for (const fx of fixturesRaw ?? []) {
      const id = fx?.fixtureGroupIdentifier ?? fx?.FixtureGroupIdentifier;
      if (id !== null && id !== undefined) s.add(String(id));
    }
    return s;
  }, [fixturesRaw]);

  const groups: UiGroup[] = useMemo(() => {
    return (groupsRaw ?? [])
      .map(toUiGroup)
      .filter((g) => g.id && g.desc)
      .filter((g) => groupIdsWithFixtures.has(String(g.id)))
      .filter((g) => g.desc.toLowerCase() !== "other matches");
  }, [groupsRaw, groupIdsWithFixtures]);

  const requestedGroupId = searchParams.get("group") ?? "";

  const activeGroupId = useMemo(() => {
    if (!groups.length) return "";

    return groups.some((group) => String(group.id) === String(requestedGroupId))
      ? requestedGroupId
      : groups[0].id;
  }, [groups, requestedGroupId]);

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }

    const currentGroupId = searchParams.get("group") ?? "";
    if (currentGroupId === activeGroupId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("group", activeGroupId);
    const nextQuery = nextParams.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [activeGroupId, pathname, router, searchParams]);

  const updateSelectedGroupId = (nextGroupId: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("group", nextGroupId);
    const nextQuery = nextParams.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const filteredMatches: UiMatch[] = useMemo(() => {
    const arr = fixturesRaw ?? [];
    if (!activeGroupId) return [];

    const byGroup = arr.filter(
      (fx) =>
        String(fx?.fixtureGroupIdentifier ?? fx?.FixtureGroupIdentifier) === String(activeGroupId)
    );

    byGroup.sort((a, b) => {
      const da = parseLRDateTime(String(a?.fixtureDate ?? ""))?.getTime() ?? 0;
      const db = parseLRDateTime(String(b?.fixtureDate ?? ""))?.getTime() ?? 0;
      return da - db;
    });

    return byGroup.slice(0, 300).map(toUiMatch);
  }, [activeGroupId, fixturesRaw]);

  const liveCarouselMatches = useMemo(() => {
    return (fixturesRaw ?? [])
      .map(toUiMatch)
      .filter(
        (match) =>
          match.liveSessionStatus === "ACTIVE" ||
          match.liveSessionStatus === "PAUSED" ||
          /LIVE|IN_PROGRESS/i.test(match.matchStatus)
      )
      .sort((left, right) => {
        const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
        const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
        return rightTime - leftTime;
      })
      .map((match): LiveCarouselMatch => ({
        id: match.id,
        href: `/matches/${match.id}/live?group=${encodeURIComponent(match.fixtureGroupId)}`,
        eventLabel: match.fixtureGroupDesc || match.roundDesc || "Published fixture",
        homeName: match.homeName,
        awayName: match.roadName,
        homeScore: match.homeScore,
        awayScore: match.roadScore,
        currentFrameNumber: match.currentFrameNumber,
        currentFrameHomePoints: match.currentFrameHomePoints,
        currentFrameAwayPoints: match.currentFrameAwayPoints,
      }));
  }, [fixturesRaw]);

  const selectedGroupDesc =
    groups.find((g) => String(g.id) === String(activeGroupId))?.desc || "Matches";
  const roundDesc = filteredMatches[0]?.roundDesc || "";
  const totalMatches = filteredMatches.length;
  const liveMatches = filteredMatches.filter((match) => /LIVE|IN_PROGRESS/i.test(match.matchStatus)).length;
  const completedMatches = filteredMatches.filter(
    (match) => match.matchStatus === "COMPLETED" || match.homeScore !== "" || match.roadScore !== ""
  ).length;
  const activeViewLabel =
    activeTab === "matches"
      ? "Live fixtures and scheduled pairings"
      : activeTab === "groups"
        ? "Round-robin tables and standings"
        : "Broadcast bracket projection";

  useLivePolling({
    enabled: fixturesRaw !== null,
    intervalMs: 3000,
    poll: async (signal) => {
      const response = await fetch("/api/public/fixtures/live", {
        signal,
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as PublicLiveMatchListResponse | null;

      if (!response.ok) {
        throw new Error(data && "error" in data ? String(data.error ?? "Failed to fetch live fixtures.") : "Failed to fetch live fixtures.");
      }

      setFixturesRaw((current) => applyLiveSnapshots(current, data?.items ?? []));
    },
  });

  const standingsGroups = standingsState.key === activeGroupId ? standingsState.data : null;
  const standingsError = standingsState.key === activeGroupId ? standingsState.error : "";
  const standingsLoading =
    activeTab === "groups" && Boolean(activeGroupId) && standingsState.key !== activeGroupId;

  const knockoutBracket = knockoutState.key === activeGroupId ? knockoutState.data : null;
  const knockoutError = knockoutState.key === activeGroupId ? knockoutState.error : "";
  const knockoutLoading =
    activeTab === "knockout" && Boolean(activeGroupId) && knockoutState.key !== activeGroupId;

  useEffect(() => {
    const el = groupsRowRef.current;
    if (!el) return;

    const EPS = 2;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;

      if (max <= 1) {
        setCanScrollGroupsLeft(false);
        setCanScrollGroupsRight(false);
        return;
      }

      setCanScrollGroupsLeft(el.scrollLeft > EPS);
      setCanScrollGroupsRight(el.scrollLeft < max - EPS);
    };

    update();
    requestAnimationFrame(update);
    const t1 = window.setTimeout(update, 250);
    const t2 = window.setTimeout(update, 850);

    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [groups.length, activeTab]);

  const scrollGroups = (direction: "left" | "right") => {
    const el = groupsRowRef.current;
    if (!el) return;

    const amount = Math.round(el.clientWidth * 0.85);

    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const row = groupsRowRef.current;
    const activeButton = activeGroupButtonRef.current;

    if (!row || !activeButton || !activeGroupId) {
      return;
    }

    const rowRect = row.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const overflowLeft = buttonRect.left < rowRect.left;
    const overflowRight = buttonRect.right > rowRect.right;

    if (!overflowLeft && !overflowRight) {
      return;
    }

    activeButton.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeGroupId, groups.length]);

  useEffect(() => {
    if (activeTab !== "groups") return;
    if (!activeGroupId) return;

    let cancelled = false;

    fetch(`/api/public/standings?fixtureGroupIdentifier=${encodeURIComponent(activeGroupId)}`)
      .then(async (r) => {
        const data = (await r.json()) as StandingsApiResponse & ApiErrorResponse;
        if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;

        const arr = Array.isArray(data?.groups) ? data.groups : [];
        setStandingsState({
          key: activeGroupId,
          data: arr,
          error: "",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setStandingsState({
          key: activeGroupId,
          data: null,
          error: err instanceof Error ? err.message : "Failed to load standings",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeGroupId, activeTab]);

  useEffect(() => {
    if (activeTab !== "knockout") return;
    if (!activeGroupId) return;

    let cancelled = false;

    fetch(
      `/api/public/knockout-bracket?fixtureGroupIdentifier=${encodeURIComponent(activeGroupId)}`
    )
      .then(async (r) => {
        const data = (await r.json()) as KnockoutBracketResponse & { error?: string };
        if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;

        setKnockoutState({
          key: activeGroupId,
          data,
          error: "",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setKnockoutState({
          key: activeGroupId,
          data: null,
          error: err instanceof Error ? err.message : "Failed to load knockout bracket",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeGroupId, activeTab]);

  const totalStandingsPlayers = useMemo(() => {
    if (!standingsGroups) return 0;
    return standingsGroups.reduce((acc, g) => acc + (g?.rows?.length ?? 0), 0);
  }, [standingsGroups]);

  return (
    <main className={`content ${styles.page}`}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Competition Hub</p>
            <div className={styles.titleRow}>
              <div>
                <h1 className={styles.title}>Matches</h1>
                <p className={styles.subtitle}>
                  Follow every published fixture, group table, and knockout path from one broadcast-style control room.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.heroStats}>
            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>Selected Tournament</p>
                <span className={styles.statIcon} aria-hidden="true">
                  <FiGrid />
                </span>
              </div>
              <p className={styles.statValue}>{groups.length}</p>
              <p className={styles.statHint}>Published groups available to browse across the current public schedule.</p>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>Fixtures</p>
                <span className={styles.statIcon} aria-hidden="true">
                  <FiCalendar />
                </span>
              </div>
              <p className={styles.statValue}>{totalMatches}</p>
              <p className={styles.statHint}>Matches currently attached to {selectedGroupDesc.toLowerCase()}.</p>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>Live / In Progress</p>
                <span className={styles.statIcon} aria-hidden="true">
                  <FiPlayCircle />
                </span>
              </div>
              <p className={styles.statValue}>{liveMatches}</p>
              <p className={styles.statHint}>Live polling keeps active scorelines current without reloading the page.</p>
            </article>

            <article className={styles.statCard}>
              <div className={styles.statTop}>
                <p className={styles.statLabel}>Completed</p>
                <span className={styles.statIcon} aria-hidden="true">
                  <FiActivity />
                </span>
              </div>
              <p className={styles.statValue}>{completedMatches}</p>
              <p className={styles.statHint}>{activeViewLabel} for the currently selected event.</p>
            </article>
          </div>
        </div>
      </section>

      {liveCarouselMatches.length > 0 ? <LiveMatchesCarousel matches={liveCarouselMatches} /> : null}

      <section className={styles.controlsPanel}>
        <div className={styles.controlsHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Navigation</p>
            <h2 className={styles.sectionTitle}>Choose a view and tournament</h2>
            <p className={styles.sectionBodyCopy}>
              Switch between the live match list, round-robin standings, and the knockout bracket while keeping the same tournament in focus.
            </p>
          </div>

          <div className={styles.tabList} role="tablist" aria-label="Matches page view">
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "matches" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("matches")}
              role="tab"
              aria-selected={activeTab === "matches"}
            >
              Matches
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "groups" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("groups")}
              role="tab"
              aria-selected={activeTab === "groups"}
            >
              Groups
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "knockout" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("knockout")}
              role="tab"
              aria-selected={activeTab === "knockout"}
            >
              Knockout
            </button>
          </div>
        </div>

        <div className={styles.groupsShell}>
          {canScrollGroupsLeft ? (
            <button
              className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
              onClick={() => scrollGroups("left")}
              aria-label="Scroll tournaments left"
              type="button"
            >
              <FiChevronLeft size={20} />
            </button>
          ) : null}

          {canScrollGroupsRight ? (
            <button
              className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
              onClick={() => scrollGroups("right")}
              aria-label="Scroll tournaments right"
              type="button"
            >
              <FiChevronRight size={20} />
            </button>
          ) : null}

          <div className={styles.groupsScroller} ref={groupsRowRef}>
            {groups.map((g) => (
              <button
                key={g.id}
                ref={String(activeGroupId) === String(g.id) ? activeGroupButtonRef : null}
                type="button"
                className={`${styles.groupButton} ${String(activeGroupId) === String(g.id) ? styles.groupButtonActive : ""}`}
                onClick={() => updateSelectedGroupId(g.id)}
                title={g.desc}
              >
                {g.desc}
              </button>
            ))}
          </div>

          {groupsError ? <p className={styles.statusText}>Failed to load tournaments: {groupsError}</p> : null}
          {!groupsError && groupsRaw === null ? <p className={styles.statusText}>Loading tournaments...</p> : null}
        </div>
      </section>

      {activeTab === "matches" ? (
        <section className={styles.contentPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Matches</p>
              <h2 className={styles.sectionTitle}>
                {selectedGroupDesc}
                {roundDesc ? ` - ${roundDesc}` : ""}
              </h2>
              <p className={styles.sectionBodyCopy}>Every pairing includes direct access to the match centre and live score updates when available.</p>
            </div>

            <p className={styles.sectionMeta}>
              {fixturesError
                ? `Failed to load fixtures: ${fixturesError}`
                : fixturesRaw === null
                  ? "Loading fixtures..."
                  : `${filteredMatches.length} matches`}
            </p>
          </div>

          <div className={styles.matchGrid}>
            {filteredMatches.map((m) => {
              const hasScore = m.homeScore !== "" || m.roadScore !== "";
              const scoreText = hasScore ? `${m.homeScore || "0"} - ${m.roadScore || "0"}` : "VS";
              const isLive = /LIVE|IN_PROGRESS/i.test(m.matchStatus);
              const isComplete = m.matchStatus === "COMPLETED" || hasScore;
              const scoreLabel = isComplete ? "Score" : "";
              const scheduleLabel = m.dateLabel
                ? (m.timeLabel && m.timeLabel !== "TBA" ? `${m.dateLabel} • ${m.timeLabel}` : m.dateLabel)
                : m.timeLabel;
              const statusClass = isLive
                ? styles.statusLive
                : isComplete
                  ? styles.statusComplete
                  : styles.statusScheduled;

              return (
                <article className={styles.matchCard} key={m.id}>
                  <div className={styles.matchCardTop}>
                    <div className={styles.matchSchedule}>
                      <span className={styles.scheduleLine}>{scheduleLabel || "TBA"}</span>
                      <div className={styles.matchStatusRow}>
                        <span className={`${styles.statusBadge} ${statusClass}`}>{formatStatusLabel(m.matchStatus)}</span>
                        {isLive ? <span className={styles.liveBadgeCompact}>Live</span> : null}
                      </div>
                    </div>

                    <p className={styles.roundMeta}>{m.roundDesc || m.fixtureGroupDesc || "Published fixture"}</p>
                  </div>

                  <div className={styles.matchBody}>
                    <div className={styles.competitor}>
                      <div className={styles.portrait}>
                        {m.homePlayerPhotoUrl ? (
                          <Image
                            src={m.homePlayerPhotoUrl}
                            alt={m.homeName}
                            width={92}
                            height={92}
                            className={styles.portraitImage}
                          />
                        ) : (
                          <Image
                            src="/images/player_silhouette.svg"
                            alt=""
                            width={92}
                            height={92}
                            className={styles.portraitSilhouette}
                          />
                        )}
                      </div>

                      <div className={styles.competitorText}>
                        {m.homePlayerId ? (
                          <Link href={`/players/${m.homePlayerId}`} className={styles.playerCell} title={m.homeName}>
                            <span className={styles.playerCellText}>{m.homeName}</span>
                          </Link>
                        ) : (
                          <p className={styles.competitorName}>{m.homeName}</p>
                        )}
                        <div className={styles.competitorSub}>
                          {m.homeCountryCode ? (
                            <Image
                              src={getFlagCdnUrl(m.homeCountryCode, "w40") ?? ""}
                              alt={m.homeCountryCode}
                              width={26}
                              height={18}
                              className={styles.flag}
                              title={m.homeCountryCode}
                            />
                          ) : null}
                          <span>{m.homeParts.first || "Home side"}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.scorePanel}>
                      {scoreLabel ? <p className={styles.scoreLabel}>{scoreLabel}</p> : null}
                      <p className={styles.scoreValue}>{scoreText}</p>
                    </div>

                    <div className={`${styles.competitor} ${styles.competitorRight}`}>
                      <div className={styles.portrait}>
                        {m.roadPlayerPhotoUrl ? (
                          <Image
                            src={m.roadPlayerPhotoUrl}
                            alt={m.roadName}
                            width={92}
                            height={92}
                            className={styles.portraitImage}
                          />
                        ) : (
                          <Image
                            src="/images/player_silhouette.svg"
                            alt=""
                            width={92}
                            height={92}
                            className={styles.portraitSilhouette}
                          />
                        )}
                      </div>

                      <div className={styles.competitorText}>
                        {m.roadPlayerId ? (
                          <Link href={`/players/${m.roadPlayerId}`} className={styles.playerCell} title={m.roadName}>
                            <span className={styles.playerCellText}>{m.roadName}</span>
                          </Link>
                        ) : (
                          <p className={styles.competitorName}>{m.roadName}</p>
                        )}
                        <div className={styles.competitorSub}>
                          {m.roadCountryCode ? (
                            <Image
                              src={getFlagCdnUrl(m.roadCountryCode, "w40") ?? ""}
                              alt={m.roadCountryCode}
                              width={26}
                              height={18}
                              className={styles.flag}
                              title={m.roadCountryCode}
                            />
                          ) : null}
                          <span>{m.roadParts.first || "Away side"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.matchCardFooter}>
                    <p className={styles.footerCopy}>Open the match centre for head-to-head context, live notes, and the latest scoreline.</p>
                    <Link href={`/matches/${m.id}?group=${encodeURIComponent(activeGroupId)}`} className={styles.matchCta}>
                      Match Centre
                    </Link>
                  </div>
                </article>
              );
            })}

            {fixturesRaw !== null && !fixturesError && filteredMatches.length === 0 ? (
              <div className={styles.emptyState}>No matches are published for this tournament yet.</div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab === "groups" ? (
        <section className={styles.standingsPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Groups</p>
              <h2 className={styles.sectionTitle}>{selectedGroupDesc}</h2>
              <p className={styles.sectionBodyCopy}>Standings update from approved results and keep the current group order visible at a glance.</p>
            </div>

            <p className={styles.sectionMeta}>
              {standingsError
                ? `Failed to load standings: ${standingsError}`
                : standingsLoading
                  ? "Loading standings..."
                  : standingsGroups
                    ? `${totalStandingsPlayers} players`
                    : ""}
            </p>
          </div>

          {!standingsLoading && !standingsError && standingsGroups && standingsGroups.length === 0 ? (
            <div className={styles.emptyState}>No group standings are available for this tournament yet.</div>
          ) : null}

          {!standingsError && standingsGroups && standingsGroups.length > 0 ? (
            <div className={styles.standingsStack}>
              {standingsGroups.map((g) => (
                <section className={styles.standingsBlock} key={g.standingsDesc}>
                  <h3 className={styles.standingsBlockTitle}>{g.standingsDesc}</h3>
                  <div className={styles.standingsTableWrap}>
                    <table className={styles.standingsTable}>
                      <thead>
                        <tr>
                          <th className={styles.rankCell}>#</th>
                          <th className={styles.teamHeader}>Player</th>
                          <th className={styles.numCell}>P</th>
                          <th className={styles.numCell}>W</th>
                          <th className={styles.numCell}>L</th>
                          <th className={styles.numCell}>+/-</th>
                          <th className={styles.ptsCell}>Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r) => (
                          <tr key={`${g.standingsDesc}-${r.rank}-${r.teamName}`}>
                            <td className={styles.rankCell}>{r.rank}</td>
                            <td className={styles.teamCell}>
                              {r.playerId ? (
                                <Link href={`/players/${r.playerId}`} className={styles.playerCell} title={r.teamName}>
                                  <span className={styles.playerCellText}>{r.teamName}</span>
                                </Link>
                              ) : (
                                <span className={styles.playerCell} title={r.teamName}>
                                  <span className={styles.playerCellText}>{r.teamName}</span>
                                </span>
                              )}
                            </td>
                            <td className={styles.numCell}>{r.played}</td>
                            <td className={styles.numCell}>{r.won}</td>
                            <td className={styles.numCell}>{r.lost}</td>
                            <td className={styles.numCell}>{r.diff}</td>
                            <td className={styles.ptsCell}>{r.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "knockout" ? (
        <section className={styles.knockoutPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Knockout Stage</p>
              <h2 className={styles.sectionTitle}>{selectedGroupDesc} Bracket</h2>
              <p className={styles.sectionBodyCopy}>Track the elimination path and advancing positions from the selected competition.</p>
            </div>

            <p className={styles.sectionMeta}>
              {knockoutError
                ? `Failed to load bracket: ${knockoutError}`
                : knockoutLoading
                  ? "Loading bracket..."
                  : knockoutBracket
                    ? `${knockoutBracket.entrantsCount} advancing players`
                    : ""}
            </p>
          </div>

          {knockoutBracket?.sourceRoundName ? (
            <p className={styles.knockoutIntro}>
              Bracket seeding currently pulls from {knockoutBracket.sourceRoundName} and displays the projected public path in broadcast order.
            </p>
          ) : null}

          {knockoutError ? <div className={styles.emptyState}>{knockoutError}</div> : null}
          {!knockoutError && knockoutLoading ? <div className={styles.emptyState}>Loading knockout bracket...</div> : null}

          {!knockoutError && !knockoutLoading && knockoutBracket && knockoutBracket.rounds.length > 0 ? (
            <div className={styles.knockoutBracketShell}>
              <KnockoutBracket
                rounds={knockoutBracket.rounds}
                title={`${selectedGroupDesc} Knockout Bracket`}
                subtitle={
                  knockoutBracket.sourceRoundName
                    ? `Advancing positions are seeded from ${knockoutBracket.sourceRoundName} and displayed in bracket order.`
                    : "Track every knockout matchup through each round in a premium bracket layout."
                }
                className="mt-2"
              />
            </div>
          ) : null}

          {!knockoutError && !knockoutLoading && knockoutBracket && knockoutBracket.rounds.length === 0 ? (
            <div className={styles.emptyState}>No knockout bracket is available for this tournament yet.</div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}