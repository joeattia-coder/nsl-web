import Image from "next/image";
import ActiveTurnMarker from "./ActiveTurnMarker";
import BreakSequence from "./BreakSequence";
import styles from "./PlayerScorePanel.module.css";
import type { OverlayPlayerData } from "./types";

type PlayerScorePanelProps = {
  player: OverlayPlayerData;
  side: "left" | "right";
  isActive: boolean;
  compact?: boolean;
  breakDisplay?: "chips" | "text";
};

function getCompactPlayerName(name: string) {
  return name
    .split("/")
    .map((segment) => {
      const parts = segment.trim().split(/\s+/).filter(Boolean);
      return parts[parts.length - 1] ?? segment.trim();
    })
    .join(" / ");
}

export default function PlayerScorePanel({
  player,
  side,
  isActive,
  compact = false,
  breakDisplay = "chips",
}: PlayerScorePanelProps) {
  const isRight = side === "right";
  const showBreak = player.currentBreak > 0;
  const compactName = getCompactPlayerName(player.name);

  return (
    <section className={`${styles.panel} ${isRight ? styles.rightPanel : ""} ${compact ? styles.compact : ""}`.trim()}>
      {isRight ? (
        <>
          <div className={styles.scoreBox}>{player.score}</div>

          <div className={`${styles.identity} ${styles.rightIdentity}`.trim()}>
            <div className={`${styles.nameRow} ${styles.nameRowRight}`.trim()}>
              {player.flagUrl ? <Image src={player.flagUrl} alt={player.flagAlt ?? ""} width={24} height={16} className={styles.flag} /> : null}
              <span className={styles.name}>
                <span className={styles.nameFull}>{player.name}</span>
                <span className={styles.nameCompact}>{compactName}</span>
              </span>
            </div>
            {showBreak ? (
              <div className={`${styles.breakRow} ${styles.breakRowRight}`.trim()}>
                <span className={styles.breakValue}>Break {player.currentBreak}</span>
                <BreakSequence balls={player.breakSequence} mode={breakDisplay} compact={compact} />
              </div>
            ) : null}
          </div>

          <span className={styles.markerSlot} aria-hidden="true">
            {isActive ? <ActiveTurnMarker direction="right" compact={compact} /> : null}
          </span>
        </>
      ) : (
        <>
          <span className={styles.markerSlot} aria-hidden="true">
            {isActive ? <ActiveTurnMarker direction="left" compact={compact} /> : null}
          </span>

          <div className={styles.identity}>
            <div className={styles.nameRow}>
              {player.flagUrl ? <Image src={player.flagUrl} alt={player.flagAlt ?? ""} width={24} height={16} className={styles.flag} /> : null}
              <span className={styles.name}>
                <span className={styles.nameFull}>{player.name}</span>
                <span className={styles.nameCompact}>{compactName}</span>
              </span>
            </div>
            {showBreak ? (
              <div className={styles.breakRow}>
                <span className={styles.breakValue}>Break {player.currentBreak}</span>
                <BreakSequence balls={player.breakSequence} mode={breakDisplay} compact={compact} />
              </div>
            ) : null}
          </div>

          <div className={styles.scoreBox}>{player.score}</div>
        </>
      )}
    </section>
  );
}