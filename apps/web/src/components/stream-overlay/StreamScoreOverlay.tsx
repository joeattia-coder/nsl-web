import FrameScoreDisplay from "./FrameScoreDisplay";
import PlayerScorePanel from "./PlayerScorePanel";
import styles from "./StreamScoreOverlay.module.css";
import type { StreamScoreOverlayProps } from "./types";

export default function StreamScoreOverlay({
  data,
  compact = false,
  breakDisplay = "chips",
  accentColor,
  className,
}: StreamScoreOverlayProps) {
  const style = accentColor ? ({ ["--overlay-accent" as string]: accentColor } as React.CSSProperties) : undefined;

  return (
    <section
      className={[styles.overlay, compact ? styles.compact : "", className ?? ""].filter(Boolean).join(" ")}
      style={style}
      aria-label="Stream match score overlay"
    >
      <div className={styles.bar}>
        <PlayerScorePanel
          player={data.leftPlayer}
          side="left"
          isActive={data.activeSide === "left"}
          compact={compact}
          breakDisplay={breakDisplay}
        />

        <div className={styles.center}>
          <FrameScoreDisplay data={data} compact={compact} />
        </div>

        <PlayerScorePanel
          player={data.rightPlayer}
          side="right"
          isActive={data.activeSide === "right"}
          compact={compact}
          breakDisplay={breakDisplay}
        />
      </div>
    </section>
  );
}