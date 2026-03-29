"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "./AdminAuthContext";

const DEFAULT_ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const MIN_ADMIN_IDLE_TIMEOUT_MS = 60 * 1000;

function resolveAdminIdleTimeoutMs() {
  const rawValue = process.env.NEXT_PUBLIC_ADMIN_IDLE_TIMEOUT_MS;
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < MIN_ADMIN_IDLE_TIMEOUT_MS) {
    return DEFAULT_ADMIN_IDLE_TIMEOUT_MS;
  }

  return parsed;
}

export default function AdminIdleSessionManager() {
  const { currentUser, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [expiredPathname, setExpiredPathname] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isLoggingOutRef = useRef(false);
  const idleTimeoutMs = useMemo(() => resolveAdminIdleTimeoutMs(), []);
  const isAdminRoute = pathname.startsWith("/admin");
  const isExpired = expiredPathname === pathname;
  const shouldTrackIdle = Boolean(currentUser?.isAdmin) && isAdminRoute && !isExpired;

  useEffect(() => {
    if (!shouldTrackIdle) {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      return;
    }

    const expireSession = () => {
      if (isLoggingOutRef.current) {
        return;
      }

      isLoggingOutRef.current = true;
      setExpiredPathname(pathname);
      void logout().catch((error) => {
        console.error("Failed to end idle admin session:", error);
      });
    };

    const resetTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(expireSession, idleTimeoutMs);
    };

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, resetTimer, { passive: true });
    }

    resetTimer();

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, resetTimer);
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [idleTimeoutMs, logout, pathname, shouldTrackIdle]);

  if (!isExpired) {
    return null;
  }

  const handleClose = () => {
    setExpiredPathname(null);
    isLoggingOutRef.current = false;
    router.push("/");
    router.refresh();
  };

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <div
        className="admin-modal admin-session-expired-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-session-expired-title"
      >
        <button
          type="button"
          className="admin-modal-close-button"
          onClick={handleClose}
          aria-label="Close session expired dialog"
        >
          ×
        </button>
        <h2 id="admin-session-expired-title" className="admin-modal-title">
          Session expired
        </h2>
        <p className="admin-modal-text">
          Your admin session expired because the page was idle for too long.
          Sign in again to continue.
        </p>
        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-modal-button admin-modal-button-primary"
            onClick={() => {
              setExpiredPathname(null);
              isLoggingOutRef.current = false;
              router.push(`/login?next=${encodeURIComponent(pathname)}`);
              router.refresh();
            }}
          >
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}