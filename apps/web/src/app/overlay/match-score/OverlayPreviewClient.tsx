"use client";

import { useEffect, useState } from "react";
import StreamScoreOverlay from "@/components/stream-overlay/StreamScoreOverlay";
import type { StreamScoreOverlayData } from "@/components/stream-overlay/types";
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

  useEffect(() => {
    setOverlayData(initialData);
  }, [initialData]);

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
      <StreamScoreOverlay data={overlayData} compact={compact} breakDisplay={breakDisplay} />
    </div>
  );
}