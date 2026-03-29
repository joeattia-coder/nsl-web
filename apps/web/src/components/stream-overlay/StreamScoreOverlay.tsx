import BreakSequence from "./BreakSequence";
import FrameScoreDisplay from "./FrameScoreDisplay";
import PlayerScorePanel from "./PlayerScorePanel";
import styles from "./StreamScoreOverlay.module.css";
import type { OverlayPlayerBanner } from "./types";
import type { StreamScoreOverlayProps } from "./types";

function renderBanner(banner: OverlayPlayerBanner | null | undefined, align: "left" | "right", breakDisplay: "chips" | "text", compact: boolean) {
  if (!banner) {
    return null;
  }

  const hasBalls = Boolean(banner.balls?.length);

  return (
    <div className={[styles.banner, align === "right" ? styles.bannerRight : ""].filter(Boolean).join(" ")}>
      <span className={styles.bannerLabel}>{banner.label}</span>
      {hasBalls ? <BreakSequence balls={banner.balls ?? []} mode={breakDisplay} compact={compact} /> : null}
      {banner.detail ? <span className={styles.bannerDetail}>{banner.detail}</span> : null}
    </div>
  );
}

export default function StreamScoreOverlay({
  data,
  compact = false,
  breakDisplay = "chips",
  accentColor,
  className,
  leftBanner,
  rightBanner,
}: StreamScoreOverlayProps) {
  const style = accentColor ? ({ ["--overlay-accent" as string]: accentColor } as React.CSSProperties) : undefined;
  const hasBannerRow = Boolean(leftBanner || rightBanner);

  return (
    <div className={[styles.stack, className ?? ""].filter(Boolean).join(" ")} style={style}>
      <section
        className={[styles.overlay, compact ? styles.compact : ""].filter(Boolean).join(" ")}
        aria-label="Stream match score overlay"
      >
        <div className={styles.bar}>
          <PlayerScorePanel
            player={data.leftPlayer}
            side="left"
            isActive={data.activeSide === "left"}
            compact={compact}
          />

          <div className={styles.center}>
            <FrameScoreDisplay data={data} compact={compact} />
          </div>

          <PlayerScorePanel
            player={data.rightPlayer}
            side="right"
            isActive={data.activeSide === "right"}
            compact={compact}
          />
        </div>
      </section>

      {hasBannerRow ? (
        <div className={styles.bannerRail} aria-hidden="true">
          <div className={styles.bannerSlot}>{renderBanner(leftBanner, "left", breakDisplay, compact)}</div>
          <div className={styles.bannerCenter} />
          <div className={styles.bannerSlot}>{renderBanner(rightBanner, "right", breakDisplay, compact)}</div>
        </div>
      ) : null}
    </div>
  );
}