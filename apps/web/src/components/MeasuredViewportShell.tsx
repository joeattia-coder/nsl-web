"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MeasuredViewportShell.module.css";

type MeasuredViewportShellProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  bottomPadding?: number;
};

type LayoutVars = React.CSSProperties & {
  [key: `--${string}`]: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value);
}

function buildLayoutVars(width: number, height: number): LayoutVars {
  const safeWidth = clamp(width || window.innerWidth, 320, 1920);
  const safeHeight = clamp(height || window.innerHeight, 320, 1200);
  const landscape = safeWidth > safeHeight * 1.1;
  const portraitScale = landscape ? 1 : clamp((safeWidth - 320) / 140, 0, 1);

  const shellPadX = clamp(round(safeWidth * 0.014), 6, 16);
  const shellPadTop = clamp(round(safeHeight * (landscape ? 0.0125 : 0.01)), 4, 11);
  const shellPadBottom = clamp(round(safeHeight * (landscape ? 0.015 : 0.02)), 5, 15);
  const stackGap = clamp(round(Math.min(safeWidth, safeHeight) * 0.02), 8, 18);

  const stagePadX = clamp(round(safeWidth * 0.02), 10, 24);
  const stagePadY = clamp(round(safeHeight * 0.022), 10, 22);
  const stageGap = clamp(round(Math.min(safeWidth, safeHeight) * 0.015), 8, 18);
  const stageCenterWidth = clamp(round(Math.min(safeWidth * 0.18, safeHeight * 0.36)), 120, 260);
  const stageAvatar = clamp(round(Math.min(safeWidth * (landscape ? 0.13 : 0.19), safeHeight * (landscape ? 0.26 : 0.18))), landscape ? 74 : 88, 180);
  const stageMetaGap = clamp(round(stageAvatar * 0.08), 6, 12);
  const stageNameSize = clamp(round(Math.min(safeWidth * 0.021, safeHeight * (landscape ? 0.03 : 0.024))), 13, 22);
  const stageFlagWidth = clamp(round(stageNameSize * 1.55), 20, 34);
  const stageFlagHeight = round(stageFlagWidth * 0.7);
  const stagePlayerGap = clamp(round(stageAvatar * 0.08), 8, 14);
  const stageStartLabel = clamp(round(Math.min(safeWidth * 0.011, safeHeight * 0.016)), 9, 12);
  const stageStartTime = clamp(round(Math.min(safeWidth * 0.03, safeHeight * (landscape ? 0.05 : 0.038))), 18, 30);
  const stageStartDate = clamp(round(Math.min(safeWidth * 0.014, safeHeight * 0.02)), 11, 15);

  const overlayPadX = clamp(round(landscape ? safeWidth * 0.016 : 6 + portraitScale * 4), 6, 18);
  const overlayPadY = clamp(round(landscape ? safeHeight * 0.014 : 5 + portraitScale * 3), 5, 14);
  const overlayRadius = clamp(round(Math.min(safeWidth, safeHeight) * 0.015), 10, 18);
  const overlayBarGap = clamp(round(landscape ? Math.min(safeWidth, safeHeight) * 0.012 : 4 + portraitScale * 2), 4, 16);
  const overlayPanelGap = clamp(round(landscape ? Math.min(safeWidth, safeHeight) * 0.01 : 3 + portraitScale * 2), 3, 12);
  const overlayIdentityGap = clamp(round(landscape ? Math.min(safeWidth, safeHeight) * 0.008 : 2 + portraitScale * 2), 2, 8);
  const overlayInlineGap = clamp(round(landscape ? Math.min(safeWidth, safeHeight) * 0.007 : 2 + portraitScale * 2), 2, 8);
  const overlayCenterWidth = clamp(round(landscape ? Math.min(safeWidth * 0.18, safeHeight * 0.34) : 76 + portraitScale * 14), 76, 220);
  const overlayNameSize = clamp(round(landscape ? Math.min(safeWidth * 0.015, safeHeight * 0.026) : 10 + portraitScale * 2), 10, 20);
  const overlayFlagWidth = clamp(round(overlayNameSize * 1.4), 18, 28);
  const overlayFlagHeight = round(overlayFlagWidth * 0.67);
  const overlayBreakSize = clamp(round(landscape ? Math.min(safeWidth * 0.01, safeHeight * 0.016) : 8 + portraitScale * 2), 8, 13);
  const overlayScoreHeight = clamp(round(landscape ? Math.min(safeWidth * 0.065, safeHeight * 0.105) : 20 + portraitScale * 4), 20, 58);
  const overlayScoreWidth = clamp(round(landscape ? Math.min(safeWidth * 0.095, safeHeight * 0.16) : 28 + portraitScale * 8), 28, 88);
  const overlayScoreFont = clamp(round(landscape ? overlayScoreHeight * 0.58 : 11 + portraitScale * 2), 11, 34);
  const overlayScoreRadius = clamp(round(overlayScoreHeight * 0.18), 6, 10);
  const overlayFrameMeta = clamp(round(landscape ? Math.min(safeWidth * 0.009, safeHeight * 0.016) : 8 + portraitScale), 8, 11);
  const overlayFrameLabel = clamp(round(landscape ? Math.min(safeWidth * 0.012, safeHeight * 0.022) : 8 + portraitScale * 2), 8, 15);
  const overlayFrameSide = clamp(round(landscape ? Math.min(safeWidth * 0.024, safeHeight * 0.05) : 12 + portraitScale * 3), 12, 34);
  const overlayFrameMiddle = clamp(round(landscape ? overlayFrameSide * 0.6 : 9 + portraitScale * 2), 9, 20);
  const overlayChipSize = clamp(round(landscape ? Math.min(safeWidth * 0.016, safeHeight * 0.03) : 9 + portraitScale * 2), 9, 22);
  const overlayChipFont = clamp(round(overlayChipSize * 0.52), 9, 12);
  const overlayChipGap = clamp(round(overlayChipSize * 0.22), 3, 6);
  const overlayMarkerHeight = clamp(round(landscape ? Math.min(safeWidth * 0.009, safeHeight * 0.018) : 4 + portraitScale * 2), 4, 11);
  const overlayMarkerWidth = clamp(round(overlayMarkerHeight * 1.45), 6, 16);
  const overlayMarkerSlotWidth = overlayMarkerWidth + 4;

  return {
    "--broadcast-content-max": "1520px",
    "--broadcast-shell-pad-x": `${shellPadX}px`,
    "--broadcast-shell-pad-top": `${shellPadTop}px`,
    "--broadcast-shell-pad-bottom": `${shellPadBottom}px`,
    "--broadcast-stack-gap": `${stackGap}px`,
    "--stage-pad-x": `${stagePadX}px`,
    "--stage-pad-y": `${stagePadY}px`,
    "--stage-gap": `${stageGap}px`,
    "--stage-center-width": `${stageCenterWidth}px`,
    "--stage-avatar-width": `${stageAvatar}px`,
    "--stage-player-gap": `${stagePlayerGap}px`,
    "--stage-meta-gap": `${stageMetaGap}px`,
    "--stage-flag-width": `${stageFlagWidth}px`,
    "--stage-flag-height": `${stageFlagHeight}px`,
    "--stage-name-size": `${stageNameSize}px`,
    "--stage-start-label-size": `${stageStartLabel}px`,
    "--stage-start-time-size": `${stageStartTime}px`,
    "--stage-start-date-size": `${stageStartDate}px`,
    "--overlay-pad-x": `${overlayPadX}px`,
    "--overlay-pad-y": `${overlayPadY}px`,
    "--overlay-radius": `${overlayRadius}px`,
    "--overlay-bar-gap": `${overlayBarGap}px`,
    "--overlay-center-width": `${overlayCenterWidth}px`,
    "--overlay-panel-gap": `${overlayPanelGap}px`,
    "--overlay-identity-gap": `${overlayIdentityGap}px`,
    "--overlay-inline-gap": `${overlayInlineGap}px`,
    "--overlay-name-size": `${overlayNameSize}px`,
    "--overlay-flag-width": `${overlayFlagWidth}px`,
    "--overlay-flag-height": `${overlayFlagHeight}px`,
    "--overlay-break-size": `${overlayBreakSize}px`,
    "--overlay-score-width": `${overlayScoreWidth}px`,
    "--overlay-score-height": `${overlayScoreHeight}px`,
    "--overlay-score-font-size": `${overlayScoreFont}px`,
    "--overlay-score-radius": `${overlayScoreRadius}px`,
    "--overlay-frame-meta-size": `${overlayFrameMeta}px`,
    "--overlay-frame-label-size": `${overlayFrameLabel}px`,
    "--overlay-frame-side-size": `${overlayFrameSide}px`,
    "--overlay-frame-middle-size": `${overlayFrameMiddle}px`,
    "--overlay-chip-size": `${overlayChipSize}px`,
    "--overlay-chip-font-size": `${overlayChipFont}px`,
    "--overlay-chip-gap": `${overlayChipGap}px`,
    "--overlay-marker-height": `${overlayMarkerHeight}px`,
    "--overlay-marker-width": `${overlayMarkerWidth}px`,
    "--overlay-marker-slot-width": `${overlayMarkerSlotWidth}px`,
  };
}

export default function MeasuredViewportShell({
  children,
  className,
  contentClassName,
  bottomPadding = 12,
}: MeasuredViewportShellProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [layoutVars, setLayoutVars] = useState<LayoutVars>({
    "--broadcast-content-max": "1520px",
  });

  useEffect(() => {
    const element = shellRef.current;

    if (!element) {
      return undefined;
    }

    let animationFrame = 0;

    const recompute = () => {
      animationFrame = 0;
      const bounds = element.getBoundingClientRect();
      const width = element.clientWidth;
      const availableHeight = Math.max(window.innerHeight - bounds.top - bottomPadding, 0);
      setLayoutVars(buildLayoutVars(width, availableHeight));
    };

    const schedule = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(recompute);
      }
    };

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(element);

    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    schedule();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [bottomPadding]);

  return (
    <div ref={shellRef} className={className ? `${styles.shell} ${className}` : styles.shell} style={layoutVars}>
      <div className={contentClassName ? `${styles.content} ${contentClassName}` : styles.content}>{children}</div>
    </div>
  );
}