"use client";

import { useEffect, useState } from "react";
import HeadToHeadStats, { type HeadToHeadStatRow } from "@/components/HeadToHeadStats";
import LocalTimeText from "@/components/LocalTimeText";
import type { PublicLiveBroadcastState, PublicLiveMatchResponse, PublicLiveMatchSnapshot } from "@/lib/live-match";
import { formatDateInAdminTimeZone } from "@/lib/timezone";
import { useLivePolling } from "@/lib/useLivePolling";
import LiveBroadcastBoard from "./LiveBroadcastBoard";
import MatchCentreBackButton from "./MatchCentreBackButton";
import styles from "./MatchCentrePage.module.css";

type LiveMatchCentrePanelProps = {
  matchId: string;
  backHref: string;
  tournamentName: string;
  seasonName: string;
  roundName: string;
  scheduledAt: string | null;
  venueLabel: string;
  initialSnapshot: PublicLiveMatchSnapshot;
  initialDetails: PublicLiveBroadcastState | null;
  leftPlayerName: string;
  rightPlayerName: string;
  leftPlayerHref?: string;
  rightPlayerHref?: string;
  leftPlayerPhoto: string | null;
  rightPlayerPhoto: string | null;
  leftPlayerFlagUrl: string | null;
  leftPlayerFlagAlt: string;
  rightPlayerFlagUrl: string | null;
  rightPlayerFlagAlt: string;
  headToHead: {
    leftWins: number;
    rightWins: number;
  };
  stats: HeadToHeadStatRow[];
};

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatCompactDate(value: string | null) {
  if (!value) {
    return "Date TBC";
  }

  const formatted = formatDateInAdminTimeZone(value, {
    month: "short",
    day: "numeric",
  });

  if (!formatted) {
    return "Date TBC";
  }

  return formatted;
}

function isSameSnapshot(left: PublicLiveMatchSnapshot, right: PublicLiveMatchSnapshot) {
  return (
    left.updatedAt === right.updatedAt &&
    left.homeScore === right.homeScore &&
    left.awayScore === right.awayScore &&
    left.matchStatus === right.matchStatus &&
    left.scheduleStatus === right.scheduleStatus &&
    left.publicNote === right.publicNote &&
    left.liveSessionStatus === right.liveSessionStatus &&
    left.currentFrameNumber === right.currentFrameNumber &&
    left.currentFrameHomePoints === right.currentFrameHomePoints &&
    left.currentFrameAwayPoints === right.currentFrameAwayPoints &&
    left.activeSide === right.activeSide
  );
}

export default function LiveMatchCentrePanel({
  matchId,
  backHref,
  tournamentName,
  seasonName,
  roundName,
  scheduledAt,
  venueLabel,
  initialSnapshot,
  initialDetails,
  leftPlayerName,
  rightPlayerName,
  leftPlayerHref,
  rightPlayerHref,
  leftPlayerPhoto,
  rightPlayerPhoto,
  leftPlayerFlagUrl,
  leftPlayerFlagAlt,
  rightPlayerFlagUrl,
  rightPlayerFlagAlt,
  headToHead,
  stats,
}: LiveMatchCentrePanelProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [details, setDetails] = useState<PublicLiveBroadcastState | null>(initialDetails);
  const hasScore = typeof snapshot.homeScore === "number" || typeof snapshot.awayScore === "number";
  const scoreLabel = hasScore ? `${snapshot.homeScore ?? 0} - ${snapshot.awayScore ?? 0}` : "VS";
  const isLive = /LIVE|IN_PROGRESS/i.test(snapshot.matchStatus);
  const compactMeta = `${formatCompactDate(scheduledAt)} • ${roundName} • ${seasonName}`;

  useEffect(() => {
    setSnapshot(initialSnapshot);
    setDetails(initialDetails);
  }, [initialDetails, initialSnapshot]);

  useLivePolling({
    enabled: Boolean(matchId),
    intervalMs: 1500,
    poll: async (signal) => {
      const response = await fetch(`/api/public/fixtures/${matchId}/live`, {
        signal,
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as PublicLiveMatchResponse | null;

      if (!response.ok) {
        throw new Error(data && "error" in data ? String(data.error ?? "Failed to fetch live match.") : "Failed to fetch live match.");
      }

      if (!data?.item) {
        return;
      }

      setSnapshot((current) => (isSameSnapshot(current, data.item) ? current : data.item));
      setDetails(data.details ?? null);
    },
  });

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>Match Centre</div>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.title}>{tournamentName}</h1>
              <p className={styles.subTitle}>{compactMeta}</p>
            </div>
            <MatchCentreBackButton className={styles.backButton} fallbackHref={backHref} />
          </div>

          <div className={styles.statusRow}>
            <span className={`${styles.statusPill} ${isLive ? styles.statusPillLive : styles.statusPillDefault}`}>
              {formatStatusLabel(snapshot.matchStatus)}
            </span>
            <span className={styles.statusHint}>
              Live score polling remains active while the match status changes.
            </span>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Scheduled</span>
              <span className={styles.metaValue}>
                <LocalTimeText
                  value={scheduledAt}
                  fallback="TBC"
                  options={{ weekday: "short", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }}
                />
              </span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Status</span>
              <span className={styles.metaValue}>{formatStatusLabel(snapshot.matchStatus)}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Venue</span>
              <span className={styles.metaValue}>{venueLabel || "Venue TBC"}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Scoreline</span>
              <span className={styles.metaValue}>{scoreLabel}</span>
            </div>
          </div>
        </div>
      </section>

      {snapshot.liveSessionStatus === "ACTIVE" || snapshot.liveSessionStatus === "PAUSED" || snapshot.liveSessionStatus === "COMPLETED" ? (
        details ? (
          <LiveBroadcastBoard
            snapshot={snapshot}
            details={details}
            leftPlayerName={leftPlayerName}
            rightPlayerName={rightPlayerName}
            leftPlayerHref={leftPlayerHref}
            rightPlayerHref={rightPlayerHref}
            leftPlayerPhoto={leftPlayerPhoto}
            rightPlayerPhoto={rightPlayerPhoto}
            leftPlayerFlagUrl={leftPlayerFlagUrl}
            leftPlayerFlagAlt={leftPlayerFlagAlt}
            rightPlayerFlagUrl={rightPlayerFlagUrl}
            rightPlayerFlagAlt={rightPlayerFlagAlt}
          />
        ) : null
      ) : null}

      <HeadToHeadStats
        leftPlayerName={leftPlayerName}
        rightPlayerName={rightPlayerName}
        leftPlayerHref={leftPlayerHref}
        rightPlayerHref={rightPlayerHref}
        leftPlayerPhoto={leftPlayerPhoto}
        rightPlayerPhoto={rightPlayerPhoto}
        leftPlayerFlagUrl={leftPlayerFlagUrl}
        leftPlayerFlagAlt={leftPlayerFlagAlt}
        rightPlayerFlagUrl={rightPlayerFlagUrl}
        rightPlayerFlagAlt={rightPlayerFlagAlt}
        leftScore={snapshot.homeScore ?? 0}
        rightScore={snapshot.awayScore ?? 0}
        headToHead={headToHead}
        stats={stats}
      />

      {snapshot.publicNote ? (
        <section className={styles.notePanel}>
          <h2 className={styles.noteTitle}>Match Notes</h2>
          <p className={styles.noteBody}>{snapshot.publicNote}</p>
        </section>
      ) : null}
    </>
  );
}