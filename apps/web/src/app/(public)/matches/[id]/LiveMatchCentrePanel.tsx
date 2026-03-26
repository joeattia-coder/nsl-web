"use client";

import { useEffect, useState } from "react";
import HeadToHeadStats, { type HeadToHeadStatRow } from "@/components/HeadToHeadStats";
import LocalTimeText from "@/components/LocalTimeText";
import type { PublicLiveMatchResponse, PublicLiveMatchSnapshot } from "@/lib/live-match";
import { useLivePolling } from "@/lib/useLivePolling";
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

function isSameSnapshot(left: PublicLiveMatchSnapshot, right: PublicLiveMatchSnapshot) {
  return (
    left.updatedAt === right.updatedAt &&
    left.homeScore === right.homeScore &&
    left.awayScore === right.awayScore &&
    left.matchStatus === right.matchStatus &&
    left.scheduleStatus === right.scheduleStatus &&
    left.publicNote === right.publicNote
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

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

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
              <p className={styles.subTitle}>{roundName} • {seasonName}</p>
            </div>
            <MatchCentreBackButton className={styles.backButton} fallbackHref={backHref} />
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
              <span className={styles.metaValue}>{snapshot.matchStatus.replaceAll("_", " ")}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Venue</span>
              <span className={styles.metaValue}>{venueLabel || "Venue TBC"}</span>
            </div>
          </div>
        </div>
      </section>

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