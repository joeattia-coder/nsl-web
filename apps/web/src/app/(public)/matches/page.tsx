"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { getFlagCdnUrl } from "@/lib/country";

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

  homeName: string;
  roadName: string;
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

type KnockoutEntrant = {
  name: string;
  countryCode: string;
};

type KnockoutSlot = {
  id: string;
  matchId: string | null;
  top: KnockoutEntrant;
  bottom: KnockoutEntrant;
};

type KnockoutRound = {
  id: string;
  label: string;
  slots: KnockoutSlot[];
};

type KnockoutBracketResponse = {
  fixtureGroupIdentifier: string;
  entrantsCount: number;
  bracketSize: number;
  sourceRoundName: string;
  rounds: KnockoutRound[];
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

function splitBracketName(full: string): NameParts {
  const parts = splitName(full);

  if (!parts.first && !parts.last) {
    return { first: "", last: full || "TBD" };
  }

  return parts;
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
  const day = d.getDate();
  const mon = d.toLocaleString(undefined, { month: "short" });
  return `${day} ${mon}`;
}

function formatTimeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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

  return {
    id,
    dateLabel: dateLabel || (rawFixtureDate ? rawFixtureDate : ""),
    timeLabel,
    homeName,
    roadName,
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

export default function MatchesPage() {
  const [groupsRaw, setGroupsRaw] = useState<AnyObj[] | null>(null);
  const [groupsError, setGroupsError] = useState("");

  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const [fixturesRaw, setFixturesRaw] = useState<AnyObj[] | null>(null);
  const [fixturesError, setFixturesError] = useState("");

  const [activeTab, setActiveTab] = useState<"matches" | "groups" | "knockout">("matches");

  // Tournament pills carousel refs + arrow state
  const groupsRowRef = useRef<HTMLDivElement | null>(null);
  const [canScrollGroupsLeft, setCanScrollGroupsLeft] = useState(false);
  const [canScrollGroupsRight, setCanScrollGroupsRight] = useState(false);

  // Standings state (Groups tab)
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

  // Load fixture groups (tournaments)
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

  // Load fixtures
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

  // Build set of tournament IDs that actually appear in fixtures
  const groupIdsWithFixtures = useMemo(() => {
    const s = new Set<string>();
    for (const fx of fixturesRaw ?? []) {
      const id = fx?.fixtureGroupIdentifier ?? fx?.FixtureGroupIdentifier;
      if (id !== null && id !== undefined) s.add(String(id));
    }
    return s;
  }, [fixturesRaw]);

  // Tournament pills shown: only those returned + have fixtures, hide "Other Matches"
  const groups: UiGroup[] = useMemo(() => {
    return (groupsRaw ?? [])
      .map(toUiGroup)
      .filter((g) => g.id && g.desc)
      .filter((g) => groupIdsWithFixtures.has(String(g.id)))
      .filter((g) => g.desc.toLowerCase() !== "other matches");
  }, [groupsRaw, groupIdsWithFixtures]);

  const activeGroupId = useMemo(() => {
    if (!groups.length) return "";

    return groups.some((group) => String(group.id) === String(selectedGroupId))
      ? selectedGroupId
      : groups[0].id;
  }, [groups, selectedGroupId]);

  // Filter matches by selected tournament
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

  const selectedGroupDesc =
    groups.find((g) => String(g.id) === String(activeGroupId))?.desc || "Matches";
  const roundDesc = filteredMatches[0]?.roundDesc || "";

  const standingsGroups = standingsState.key === activeGroupId ? standingsState.data : null;
  const standingsError = standingsState.key === activeGroupId ? standingsState.error : "";
  const standingsLoading =
    activeTab === "groups" && Boolean(activeGroupId) && standingsState.key !== activeGroupId;

  const knockoutBracket = knockoutState.key === activeGroupId ? knockoutState.data : null;
  const knockoutError = knockoutState.key === activeGroupId ? knockoutState.error : "";
  const knockoutLoading =
    activeTab === "knockout" && Boolean(activeGroupId) && knockoutState.key !== activeGroupId;

  // -----------------------------
  // TOURNAMENT PILLS ARROW LOGIC
  // -----------------------------
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

  // -----------------------------
  // FETCH GROUP STAGE STANDINGS (Groups tab)
  // -----------------------------
  useEffect(() => {
    if (activeTab !== "groups") return;
    if (!activeGroupId) return;

    let cancelled = false;

    fetch(
  `/api/public/standings?fixtureGroupIdentifier=${encodeURIComponent(
    activeGroupId
  )}`
)
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
    <main className="content">
      <div className="matches-page-header">
        <div>
          <h1 className="matches-page-title">Matches</h1>
          <p className="matches-page-subtitle">Browse fixtures by tournament.</p>
        </div>
      </div>

      {/* Season segmented control */}
      <section className="season-switch-section">
        <h2 className="season-title">Season</h2>

        <div className="season-switch season-switch-three" role="tablist" aria-label="Matches page view">
          <button
            type="button"
            className={`season-tab ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
            role="tab"
            aria-selected={activeTab === "matches"}
          >
            Matches
          </button>

          <button
            type="button"
            className={`season-tab ${activeTab === "groups" ? "active" : ""}`}
            onClick={() => setActiveTab("groups")}
            role="tab"
            aria-selected={activeTab === "groups"}
          >
            Groups
          </button>

          <button
            type="button"
            className={`season-tab ${activeTab === "knockout" ? "active" : ""}`}
            onClick={() => setActiveTab("knockout")}
            role="tab"
            aria-selected={activeTab === "knockout"}
          >
            Knockout Stage
          </button>
        </div>
      </section>

      {/* Tournament pills */}
      <section className="groups-section">
        <div className="groups-carousel-wrapper">
          {canScrollGroupsLeft && (
            <button
              className="carousel-arrow left"
              onClick={() => scrollGroups("left")}
              aria-label="Scroll tournaments left"
              type="button"
            >
              <FiChevronLeft size={24} style={{ stroke: "#fff" }} />
            </button>
          )}

          {canScrollGroupsRight && (
            <button
              className="carousel-arrow right"
              onClick={() => scrollGroups("right")}
              aria-label="Scroll tournaments right"
              type="button"
            >
              <FiChevronRight size={24} style={{ stroke: "#fff" }} />
            </button>
          )}

          <div className="groups-row" ref={groupsRowRef}>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`group-pill ${String(activeGroupId) === String(g.id) ? "active" : ""}`}
                onClick={() => setSelectedGroupId(g.id)}
                title={g.desc}
              >
                {g.desc}
              </button>
            ))}
          </div>
        </div>

        {groupsError && <div className="api-error">Failed to load tournaments: {groupsError}</div>}
        {!groupsError && groupsRaw === null && <div className="api-loading">Loading tournaments…</div>}
      </section>

      {/* MATCHES TAB */}
      {activeTab === "matches" && (
        <section className="matches-list-section">
          <div className="matches-list-header">
            <h2 className="matches-list-title">
              {selectedGroupDesc}
              {roundDesc && ` - ${roundDesc}`}
            </h2>

            <div className="matches-list-meta">
              {fixturesError
                ? `Failed to load fixtures: ${fixturesError}`
                : fixturesRaw === null
                ? "Loading fixtures…"
                : `${filteredMatches.length} matches`}
            </div>
          </div>

          <div className="matches-lines">
            {filteredMatches.map((m) => {
              const hasScore = m.homeScore !== "" || m.roadScore !== "";
              const scoreText = hasScore ? `${m.homeScore || "0"} - ${m.roadScore || "0"}` : "—";

              return (
                <div className="match-line" key={m.id}>
                  <div className="match-when">
                    <div className="match-time">{m.timeLabel}</div>
                    <div className="match-date">{m.dateLabel}</div>
                  </div>

                  <div className="match-center">
                    <div className="name-stack left">
                      {!!m.homeParts.first && <div className="name-first">{m.homeParts.first}</div>}
                      <div className="name-last">{m.homeParts.last || m.homeName}</div>
                      {m.homeCountryCode ? (
                        <div className="name-flag-row name-flag-row-left">
                          <Image
                            src={getFlagCdnUrl(m.homeCountryCode, "w40") ?? ""}
                            alt={m.homeCountryCode}
                            width={40}
                            height={30}
                            className="name-flag-img"
                            title={m.homeCountryCode}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="match-icon">
                      {m.homePlayerPhotoUrl ? (
                        <Image
                          src={m.homePlayerPhotoUrl}
                          alt={m.homeName}
                          width={72}
                          height={72}
                          className="match-player-photo"
                        />
                      ) : (
                        <Image
                          src="/images/player_silhouette.svg"
                          alt=""
                          width={72}
                          height={72}
                          className="match-silhouette"
                        />
                      )}
                    </div>

                    <div className="match-score">{scoreText}</div>

                    <div className="match-icon">
                      {m.roadPlayerPhotoUrl ? (
                        <Image
                          src={m.roadPlayerPhotoUrl}
                          alt={m.roadName}
                          width={72}
                          height={72}
                          className="match-player-photo"
                        />
                      ) : (
                        <Image
                          src="/images/player_silhouette.svg"
                          alt=""
                          width={72}
                          height={72}
                          className="match-silhouette"
                        />
                      )}
                    </div>

                    <div className="name-stack right">
                      {!!m.roadParts.first && <div className="name-first">{m.roadParts.first}</div>}
                      <div className="name-last">{m.roadParts.last || m.roadName}</div>
                      {m.roadCountryCode ? (
                        <div className="name-flag-row name-flag-row-right">
                          <Image
                            src={getFlagCdnUrl(m.roadCountryCode, "w40") ?? ""}
                            alt={m.roadCountryCode}
                            width={40}
                            height={30}
                            className="name-flag-img"
                            title={m.roadCountryCode}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="match-actions">
                    <button type="button" className="match-cta">
                      Match Centre
                    </button>
                  </div>
                </div>
              );
            })}

            {fixturesRaw !== null && !fixturesError && filteredMatches.length === 0 && (
              <div className="empty-state">No matches found for this tournament.</div>
            )}
          </div>
        </section>
      )}

      {activeTab === "knockout" && (
        <section className="knockout-section">
          <div className="matches-list-header">
            <h2 className="matches-list-title">{selectedGroupDesc} - Knockout Stage</h2>

            <div className="matches-list-meta">
              {knockoutError
                ? `Failed to load bracket: ${knockoutError}`
                : knockoutLoading
                ? "Loading bracket…"
                : knockoutBracket
                ? `${knockoutBracket.entrantsCount} advancing players`
                : ""}
            </div>
          </div>

          {knockoutBracket?.sourceRoundName ? (
            <p className="knockout-source-text">
              Bracket projection is based on {knockoutBracket.sourceRoundName} advancement settings.
            </p>
          ) : null}

          {knockoutError ? <div className="empty-state">{knockoutError}</div> : null}

          {!knockoutError && knockoutLoading ? (
            <div className="empty-state">Loading knockout bracket…</div>
          ) : null}

          {!knockoutError && !knockoutLoading && knockoutBracket && knockoutBracket.rounds.length > 0 ? (
            <div className="knockout-bracket-shell">
              <div className="knockout-bracket">
                {knockoutBracket.rounds.map((round, roundIndex) => {
                  const isLastRound = roundIndex === knockoutBracket.rounds.length - 1;
                  const slotGap = Math.max(20, 28 * (2 ** roundIndex - 1) + 20);
                  const paddingTop = roundIndex === 0 ? 0 : 30 * 2 ** (roundIndex - 1);

                  return (
                    <div className="knockout-round" key={round.id}>
                      <div className="knockout-round-title">{round.label}</div>

                      <div
                        className="knockout-round-slots"
                        style={{ gap: `${slotGap}px`, paddingTop: `${paddingTop}px` }}
                      >
                        {round.slots.map((slot) => {
                          const topParts = splitBracketName(slot.top.name);
                          const bottomParts = splitBracketName(slot.bottom.name);

                          return (
                            <div
                              key={slot.id}
                              className={`knockout-slot ${isLastRound ? "is-last-round" : ""}`}
                            >
                              <div className="knockout-player-card">
                                <div className="knockout-player-text">
                                  {topParts.first ? (
                                    <div className="knockout-player-first">{topParts.first}</div>
                                  ) : null}
                                  <div className="knockout-player-last">{topParts.last || slot.top.name}</div>
                                </div>
                                {slot.top.countryCode ? (
                                    <Image
                                    src={getFlagCdnUrl(slot.top.countryCode, "w40") ?? ""}
                                    alt={slot.top.countryCode}
                                      width={40}
                                      height={30}
                                    className="knockout-flag-img"
                                    title={slot.top.countryCode}
                                  />
                                ) : null}
                              </div>

                              <div className="knockout-slot-divider" />

                              <div className="knockout-player-card">
                                <div className="knockout-player-text">
                                  {bottomParts.first ? (
                                    <div className="knockout-player-first">{bottomParts.first}</div>
                                  ) : null}
                                  <div className="knockout-player-last">
                                    {bottomParts.last || slot.bottom.name}
                                  </div>
                                </div>
                                {slot.bottom.countryCode ? (
                                  <Image
                                    src={getFlagCdnUrl(slot.bottom.countryCode, "w40") ?? ""}
                                    alt={slot.bottom.countryCode}
                                    width={40}
                                    height={30}
                                    className="knockout-flag-img"
                                    title={slot.bottom.countryCode}
                                  />
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!knockoutError &&
          !knockoutLoading &&
          knockoutBracket &&
          knockoutBracket.rounds.length === 0 ? (
            <div className="empty-state">No knockout bracket is available for this tournament yet.</div>
          ) : null}
        </section>
      )}

      {/* GROUPS TAB */}
      {activeTab === "groups" && (
        <section className="standings-section">
          <div className="standings-header">
            <h2 className="standings-title">{selectedGroupDesc}</h2>

            <div className="standings-meta">
              {standingsError
                ? `Failed to load standings: ${standingsError}`
                : standingsLoading
                ? "Loading standings…"
                : standingsGroups
                ? `${totalStandingsPlayers} players`
                : ""}
            </div>
          </div>

          {!standingsLoading && !standingsError && standingsGroups && standingsGroups.length === 0 && (
            <div className="empty-state">No group standings available for this tournament.</div>
          )}

          {!standingsError &&
            standingsGroups &&
            standingsGroups.length > 0 &&
            standingsGroups.map((g) => (
              <div className="standings-block" key={g.standingsDesc}>
                <div className="standings-block-title">{g.standingsDesc}</div>

                <div className="standings-table-wrap">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th className="col-rank">#</th>
                        <th className="col-team">Player</th>
                        <th className="col-num">P</th>
                        <th className="col-num">W</th>
                        <th className="col-num">L</th>
                        <th className="col-num">+/-</th>
                        <th className="col-pts">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={`${g.standingsDesc}-${r.rank}-${r.teamName}`}>
                          <td className="col-rank">{r.rank}</td>
                          <td className="col-team">
                            <div className="player-cell" title={r.teamName}>
                              {r.teamName}
                            </div>
                          </td>
                          <td className="col-num">{r.played}</td>
                          <td className="col-num">{r.won}</td>
                          <td className="col-num">{r.lost}</td>
                          <td className="col-num">{r.diff}</td>
                          <td className="col-pts">{r.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </section>
      )}
    </main>
  );
}