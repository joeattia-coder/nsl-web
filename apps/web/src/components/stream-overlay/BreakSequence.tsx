import styles from "./BreakSequence.module.css";
import type { OverlayBreakBall } from "./types";

type BreakSequenceProps = {
  balls: OverlayBreakBall[];
  mode?: "chips" | "text";
  compact?: boolean;
};

type BreakBallSummary = {
  color: OverlayBreakBall["color"];
  isFreeBall?: boolean;
  count: number;
};

function summarizeBalls(balls: OverlayBreakBall[]): BreakBallSummary[] {
  const order: BreakBallSummary[] = [];
  const lookup = new Map<string, BreakBallSummary>();

  for (const ball of balls) {
    const key = `${ball.isFreeBall ? "free" : "std"}:${ball.color}`;
    const existing = lookup.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    const summary: BreakBallSummary = {
      color: ball.color,
      isFreeBall: ball.isFreeBall,
      count: 1,
    };

    lookup.set(key, summary);
    order.push(summary);
  }

  return order;
}

function formatText(ball: OverlayBreakBall) {
  if (ball.isFreeBall) {
    return `free ${ball.color}`;
  }

  return ball.color;
}

export default function BreakSequence({
  balls,
  mode = "chips",
  compact = false,
}: BreakSequenceProps) {
  const summarizedBalls = summarizeBalls(balls);

  if (balls.length === 0) {
    return null;
  }

  if (mode === "text") {
    return (
      <span className={`${styles.text} ${compact ? styles.textCompact : ""}`.trim()}>
        {summarizedBalls.map((ball) => `${ball.count} ${formatText(ball)}`).join(" ")}
      </span>
    );
  }

  return (
    <span className={`${styles.sequence} ${compact ? styles.sequenceCompact : ""}`.trim()}>
      {summarizedBalls.map((ball) => (
        <span
          key={`${ball.color}-${ball.isFreeBall ? "free" : "std"}`}
          className={[
            styles.chip,
            compact ? styles.chipCompact : "",
            styles[`chip${ball.color.charAt(0).toUpperCase()}${ball.color.slice(1)}` as keyof typeof styles],
            ball.isFreeBall ? styles.freeBall : "",
          ].filter(Boolean).join(" ")}
          aria-label={`${ball.count} ${ball.isFreeBall ? "free " : ""}${ball.color} ball${ball.count === 1 ? "" : "s"}`}
        >
          {ball.count > 1 ? ball.count : ""}
        </span>
      ))}
    </span>
  );
}