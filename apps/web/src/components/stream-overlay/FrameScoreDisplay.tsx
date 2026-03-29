import styles from "./FrameScoreDisplay.module.css";
import type { StreamScoreOverlayData } from "./types";

type FrameScoreDisplayProps = {
  data: StreamScoreOverlayData;
  compact?: boolean;
};

export default function FrameScoreDisplay({ data, compact = false }: FrameScoreDisplayProps) {
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ""}`.trim()}>
      <div className={styles.score}>
        <span className={styles.side}>{data.frameScoreLeft}</span>
        <span className={styles.middle}>({data.bestOf})</span>
        <span className={styles.side}>{data.frameScoreRight}</span>
      </div>
      {data.matchLabel ? <div className={styles.matchLabel}>{data.matchLabel}</div> : null}
    </div>
  );
}