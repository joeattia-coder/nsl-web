"use client";

import { useEffect, useRef, useState } from "react";

type UseLivePollingOptions = {
  enabled?: boolean;
  intervalMs: number;
  poll: (signal: AbortSignal) => Promise<void>;
  runOnVisible?: boolean;
};

export function useLivePolling({
  enabled = true,
  intervalMs,
  poll,
  runOnVisible = true,
}: UseLivePollingOptions) {
  const pollRef = useRef(poll);
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const executeRef = useRef<() => Promise<void>>(async () => {});
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  useEffect(() => {
    const execute = async () => {
      if (!enabled || inFlightRef.current || document.visibilityState === "hidden") {
        return;
      }

      const controller = new AbortController();
      inFlightRef.current = true;
      abortRef.current = controller;
      setIsPolling(true);

      try {
        await pollRef.current(controller.signal);
        setError(null);
        setLastUpdatedAt(Date.now());
      } catch (pollError) {
        if (!controller.signal.aborted) {
          setError(pollError instanceof Error ? pollError.message : "Polling failed.");
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        inFlightRef.current = false;
        setIsPolling(false);
      }
    };

    executeRef.current = execute;

    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }

    const intervalId = window.setInterval(() => {
      void execute();
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (runOnVisible && document.visibilityState === "visible") {
        void execute();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      abortRef.current?.abort();
      abortRef.current = null;
      inFlightRef.current = false;
    };
  }, [enabled, intervalMs, runOnVisible]);

  return {
    error,
    isPolling,
    lastUpdatedAt,
    refreshNow: async () => {
      await executeRef.current();
    },
  };
}