import Image from "next/image";
import Link from "next/link";
import type { PublicLiveBroadcastState, PublicLiveMatchSnapshot } from "@/lib/live-match";
import { formatDateInAdminTimeZone } from "@/lib/timezone";
import styles from "./LiveBroadcastBoard.module.css";

type LiveBroadcastBoardProps = {
  snapshot: PublicLiveMatchSnapshot;
  details: PublicLiveBroadcastState;
  leftPlayerName: string;
  rightPlayerName: string;
  leftPlayerHref?: string;
  rightPlayerHref?: string;
  leftPlayerPhoto: string | null;
  rightPlayerPhoto: string | null;
  leftPlayerFlagUrl?: string | null;
  leftPlayerFlagAlt?: string;
  rightPlayerFlagUrl?: string | null;
  rightPlayerFlagAlt?: string;
};

function renderPlayerName(name: string) {
  const trimmed = name.trim();
  const [first, ...rest] = trimmed.split(/\s+/);

  return (
    <>
      <span className={styles.playerPrimary}>{first || trimmed}</span>
      {rest.length > 0 ? <span className={styles.playerSecondary}>{rest.join(" ")}</span> : null}
    </>
  );
}

function renderPhoto(photo: string | null, name: string) {
  if (photo) {
    return <Image src={photo} alt={name} width={240} height={300} className={styles.playerPhoto} />;
  }

  return <Image src="/images/player_silhouette.svg" alt="" width={240} height={300} className={styles.playerPhoto} />;
}

function formatShotLabel(value: string | null) {
  if (!value || value === "none") {
    return "Frame complete";
  }

  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatBalls(value: string[]) {
  if (value.length === 0) {
    return "No pots yet";
  }

  return value.map((ball) => ball.charAt(0).toUpperCase()).join(" • ");
}

export default function LiveBroadcastBoard({
  snapshot,
  details,
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
}: LiveBroadcastBoardProps) {
  const currentFrame = details.frames.find((frame) => frame.isCurrent) ?? null;
  const currentBreakLabel = details.currentBreak
    ? `${details.currentBreak.side === "home" ? leftPlayerName : rightPlayerName} ${details.currentBreak.points}`
    : "No active break";

  return (
    <section className={styles.panel} aria-labelledby="live-broadcast-title">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Live Match Feed</p>
          <h2 id="live-broadcast-title" className={styles.title}>Broadcast Scoreboard</h2>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.liveBadge}>Live</span>
          <span className={styles.headerStamp}>
            Updated {formatDateInAdminTimeZone(snapshot.updatedAt, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className={styles.heroBoard}>
        <div className={styles.playerColumn}>
          <div className={styles.playerShell}>{renderPhoto(leftPlayerPhoto, leftPlayerName)}</div>
          <div className={styles.playerMeta}>
            {leftPlayerHref ? (
              <Link href={leftPlayerHref} className={styles.playerName}>{renderPlayerName(leftPlayerName)}</Link>
            ) : (
              <div className={styles.playerName}>{renderPlayerName(leftPlayerName)}</div>
            )}
            {leftPlayerFlagUrl ? <Image src={leftPlayerFlagUrl} alt={leftPlayerFlagAlt ?? ""} width={26} height={18} className={styles.flag} /> : null}
          </div>
        </div>

        <div className={styles.centerBoard}>
          <div className={styles.scorelineWrap}>
            <div className={styles.matchScoreLabel}>Frames</div>
            <div className={styles.matchScoreValue}>
              <span>{snapshot.homeScore ?? 0}</span>
              <span className={styles.scoreDash}>-</span>
              <span>{snapshot.awayScore ?? 0}</span>
            </div>
            <div className={styles.matchStatus}>{snapshot.matchStatus.replace(/_/g, " ")}</div>
          </div>

          <div className={styles.currentFrameGrid}>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Current Frame</span>
              <span className={styles.metricValue}>#{details.currentFrameNumber ?? "-"}</span>
              <span className={styles.metricHint}>{currentFrame ? `${currentFrame.homePoints} - ${currentFrame.awayPoints}` : "Waiting for first scoring update"}</span>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Current Break</span>
              <span className={styles.metricValue}>{details.currentBreak?.points ?? 0}</span>
              <span className={styles.metricHint}>{currentBreakLabel}</span>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Shot On</span>
              <span className={styles.metricValue}>{formatShotLabel(details.expectedShot)}</span>
              <span className={styles.metricHint}>{details.activeSide ? `${details.activeSide === "home" ? leftPlayerName : rightPlayerName} at table` : "No active side"}</span>
            </article>
            <article className={styles.metricCard}>
              <span className={styles.metricLabel}>Reds Left</span>
              <span className={styles.metricValue}>{details.redsRemaining ?? 0}</span>
              <span className={styles.metricHint}>Live session state</span>
            </article>
          </div>

          <div className={styles.ribbonGrid}>
            <div className={styles.ribbonCard}>
              <span className={styles.ribbonLabel}>Highest Break So Far</span>
              <div className={styles.ribbonValueRow}>
                <span>{details.highestBreak.home ?? 0}</span>
                <span className={styles.scoreDash}>-</span>
                <span>{details.highestBreak.away ?? 0}</span>
              </div>
            </div>
            <div className={styles.ribbonCard}>
              <span className={styles.ribbonLabel}>Fouls</span>
              <div className={styles.ribbonValueRow}>
                <span>{details.totalFouls.home}</span>
                <span className={styles.scoreDash}>-</span>
                <span>{details.totalFouls.away}</span>
              </div>
            </div>
            <div className={styles.ribbonCardWide}>
              <span className={styles.ribbonLabel}>Break Sequence</span>
              <div className={styles.breakTrail}>{details.currentBreak ? formatBalls(details.currentBreak.balls) : "No break in progress"}</div>
            </div>
          </div>
        </div>

        <div className={styles.playerColumn}>
          <div className={styles.playerShell}>{renderPhoto(rightPlayerPhoto, rightPlayerName)}</div>
          <div className={`${styles.playerMeta} ${styles.playerMetaRight}`}>
            {rightPlayerFlagUrl ? <Image src={rightPlayerFlagUrl} alt={rightPlayerFlagAlt ?? ""} width={26} height={18} className={styles.flag} /> : null}
            {rightPlayerHref ? (
              <Link href={rightPlayerHref} className={styles.playerName}>{renderPlayerName(rightPlayerName)}</Link>
            ) : (
              <div className={styles.playerName}>{renderPlayerName(rightPlayerName)}</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.framesStrip}>
        {details.frames.map((frame) => (
          <article
            key={frame.frameNumber}
            className={`${styles.frameCard} ${frame.isCurrent ? styles.frameCardCurrent : ""} ${frame.isComplete ? styles.frameCardComplete : ""}`.trim()}
          >
            <div className={styles.frameHeader}>
              <span className={styles.frameLabel}>Frame {frame.frameNumber}</span>
              {frame.isCurrent ? <span className={styles.frameState}>Live</span> : null}
              {!frame.isCurrent && frame.isComplete ? <span className={styles.frameStateMuted}>Complete</span> : null}
            </div>
            <div className={styles.frameScore}>{frame.homePoints} - {frame.awayPoints}</div>
            <div className={styles.frameMetaRow}>
              <span>HB {frame.homeHighBreak ?? 0}</span>
              <span>HB {frame.awayHighBreak ?? 0}</span>
            </div>
            <div className={styles.frameMetaRow}>
              <span>F {frame.homeFouls}</span>
              <span>F {frame.awayFouls}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}