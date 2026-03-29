"use client";

import { useEffect, useRef, useState } from "react";
import StreamScoreOverlay from "@/components/stream-overlay/StreamScoreOverlay";
import type { OverlayPlayerBanner, StreamScoreOverlayData } from "@/components/stream-overlay/types";
import type { PublicLiveMatchResponse } from "@/lib/live-match";
import { useLivePolling } from "@/lib/useLivePolling";
import { mergeOverlayDataFromLiveResponse } from "./overlay-data";
import styles from "./page.module.css";

type OverlayPreviewClientProps = {
  initialData: StreamScoreOverlayData;
  matchId?: string;
  compact?: boolean;
  breakDisplay?: "chips" | "text";
  wrapperClassName?: string;
};

type BannerState = {
  left: OverlayPlayerBanner | null;
  right: OverlayPlayerBanner | null;
};

const BREAK_MILESTONES = [15, 35, 50, 70, 100];
const BREAK_BANNER_DURATION_MS = 10000;
const CONTEXT_BANNER_DURATION_MS = 10000;

function getEmptyBannerState(): BannerState {
  return {
    left: null,
    right: null,
  };
}

function buildBreakBanner(data: StreamScoreOverlayData): BannerState {
  if (data.activeSide === "left" && data.leftPlayer.currentBreak > 0) {
    return {
      left: {
        label: `Break ${data.leftPlayer.currentBreak}`,
        balls: data.leftPlayer.breakSequence,
      },
      right: null,
    };
  }

  if (data.activeSide === "right" && data.rightPlayer.currentBreak > 0) {
    return {
      left: null,
      right: {
        label: `Break ${data.rightPlayer.currentBreak}`,
        balls: data.rightPlayer.breakSequence,
      },
    };
  }

  return getEmptyBannerState();
}

function buildContextBanner(data: StreamScoreOverlayData): BannerState {
  const leaderSide = data.frameContext?.leaderSide ?? null;
  const ahead = data.frameContext?.ahead ?? 0;
  const remaining = data.frameContext?.remaining ?? null;

  if (!leaderSide || ahead <= 0 || remaining === null) {
    return getEmptyBannerState();
  }

  const banner: OverlayPlayerBanner = {
    label: `Ahead: ${ahead}`,
    detail: `Remaining: ${remaining}`,
  };

  return leaderSide === "left"
    ? { left: banner, right: null }
    : { left: null, right: banner };
}

function getActiveBreakValue(data: StreamScoreOverlayData) {
  if (data.activeSide === "left") {
    return data.leftPlayer.currentBreak;
  }

  if (data.activeSide === "right") {
    return data.rightPlayer.currentBreak;
  }

  return 0;
}

function getContextSignature(data: StreamScoreOverlayData) {
  const leaderSide = data.frameContext?.leaderSide ?? null;
  const ahead = data.frameContext?.ahead ?? 0;
  const remaining = data.frameContext?.remaining ?? null;

  if (!leaderSide || ahead <= 0 || remaining === null) {
    return null;
  }

  return `${leaderSide}:${ahead}:${remaining}`;
}

function isSameOverlay(left: StreamScoreOverlayData, right: StreamScoreOverlayData) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function OverlayPreviewClient({
  initialData,
  matchId,
  compact = false,
  breakDisplay = "chips",
  wrapperClassName,
}: OverlayPreviewClientProps) {
  const [overlayData, setOverlayData] = useState(initialData);
  const [bannerState, setBannerState] = useState<BannerState>(getEmptyBannerState);
  const shownMilestonesRef = useRef<{ left: number[]; right: number[] }>({ left: [], right: [] });
  const breakTimeoutRef = useRef<number | null>(null);
  const contextTimeoutRef = useRef<number | null>(null);
  const lastShownContextSignatureRef = useRef<string | null>(null);

  const clearBreakTimeout = () => {
    if (breakTimeoutRef.current) {
      window.clearTimeout(breakTimeoutRef.current);
      breakTimeoutRef.current = null;
    }
  };

  const clearContextTimeout = () => {
    if (contextTimeoutRef.current) {
      window.clearTimeout(contextTimeoutRef.current);
      contextTimeoutRef.current = null;
    }
  };

  const scheduleContextBanner = (data: StreamScoreOverlayData) => {
    const nextBanner = buildContextBanner(data);
    const nextSignature = getContextSignature(data);

    if (!nextBanner.left && !nextBanner.right || !nextSignature) {
      setBannerState(getEmptyBannerState());
      lastShownContextSignatureRef.current = null;
      return;
    }

    setBannerState(nextBanner);
    lastShownContextSignatureRef.current = nextSignature;
    clearContextTimeout();
    contextTimeoutRef.current = window.setTimeout(() => {
      setBannerState(getEmptyBannerState());
      contextTimeoutRef.current = null;
    }, CONTEXT_BANNER_DURATION_MS);
  };

  const showBreakBanner = (data: StreamScoreOverlayData) => {
    setBannerState(buildBreakBanner(data));
    clearBreakTimeout();
    clearContextTimeout();
    breakTimeoutRef.current = window.setTimeout(() => {
      breakTimeoutRef.current = null;
      scheduleContextBanner(data);
    }, BREAK_BANNER_DURATION_MS);
  };

  const updateTimedBanners = (data: StreamScoreOverlayData) => {
    const activeSide = data.activeSide;
    const activeBreak = getActiveBreakValue(data);
    const contextSignature = getContextSignature(data);
    const hasVisibleContextBanner = Boolean(contextTimeoutRef.current) && !breakTimeoutRef.current;
    const hasVisibleBreakBanner = Boolean(breakTimeoutRef.current);

    if (data.leftPlayer.currentBreak <= 0) {
      shownMilestonesRef.current.left = [];
    } else {
      shownMilestonesRef.current.left = shownMilestonesRef.current.left.filter((milestone) => milestone <= data.leftPlayer.currentBreak);
    }

    if (data.rightPlayer.currentBreak <= 0) {
      shownMilestonesRef.current.right = [];
    } else {
      shownMilestonesRef.current.right = shownMilestonesRef.current.right.filter((milestone) => milestone <= data.rightPlayer.currentBreak);
    }

    if (!activeSide || activeBreak <= 0) {
      if (hasVisibleBreakBanner) {
        setBannerState(getEmptyBannerState());
        clearBreakTimeout();
      }

      if (hasVisibleContextBanner) {
        if (contextSignature) {
          setBannerState(buildContextBanner(data));
          lastShownContextSignatureRef.current = contextSignature;
        } else {
          setBannerState(getEmptyBannerState());
          clearContextTimeout();
          lastShownContextSignatureRef.current = null;
        }
        return;
      }

      if (!breakTimeoutRef.current && contextSignature && contextSignature !== lastShownContextSignatureRef.current) {
        scheduleContextBanner(data);
      }
      return;
    }

    if (hasVisibleBreakBanner) {
      setBannerState(buildBreakBanner(data));
    }

    const shownMilestones = shownMilestonesRef.current[activeSide];
    const nextMilestone = BREAK_MILESTONES.find((milestone) => activeBreak >= milestone && !shownMilestones.includes(milestone));

    if (nextMilestone) {
      shownMilestones.push(nextMilestone);
      showBreakBanner(data);
      return;
    }

    if (
      !breakTimeoutRef.current &&
      !contextTimeoutRef.current &&
      !bannerState.left &&
      !bannerState.right &&
      contextSignature &&
      contextSignature !== lastShownContextSignatureRef.current
    ) {
      scheduleContextBanner(data);
    }
  };

  useEffect(() => {
    setOverlayData(initialData);
    setBannerState(getEmptyBannerState());
    shownMilestonesRef.current = { left: [], right: [] };
    lastShownContextSignatureRef.current = null;
  }, [initialData]);

  useEffect(() => {
    updateTimedBanners(overlayData);
  }, [overlayData]);

  useEffect(() => {
    return () => {
      clearBreakTimeout();
      clearContextTimeout();
    };
  }, []);

  useLivePolling({
    enabled: Boolean(matchId),
    intervalMs: 1500,
    poll: async (signal) => {
      if (!matchId) {
        return;
      }

      // Future live integrations can swap this polling call for websockets without changing the overlay component API.
      const response = await fetch(`/api/public/fixtures/${matchId}/live`, {
        signal,
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as PublicLiveMatchResponse | null;

      if (!response.ok || !data?.item) {
        throw new Error("Failed to fetch live overlay data.");
      }

      setOverlayData((current) => {
        const next = mergeOverlayDataFromLiveResponse(current, data);
        return isSameOverlay(current, next) ? current : next;
      });
    },
  });

  return (
    <div className={wrapperClassName ?? styles.stage}>
      <StreamScoreOverlay
        data={overlayData}
        compact={compact}
        breakDisplay={breakDisplay}
        leftBanner={bannerState.left}
        rightBanner={bannerState.right}
      />
    </div>
  );
}