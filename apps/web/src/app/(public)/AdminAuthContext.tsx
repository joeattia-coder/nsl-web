"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { CurrentAdminUserSummary } from "@/lib/admin-auth-types";

export const ADMIN_AUTH_CHANGED_EVENT = "nsl:admin-auth-changed";

export function notifyAdminAuthChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_CHANGED_EVENT));
}

type AdminAuthContextValue = {
  currentUser: CurrentAdminUserSummary | null;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<CurrentAdminUserSummary | null>;
};

const AdminAuthContext = createContext<AdminAuthContextValue>({
  currentUser: null,
  isLoading: false,
  hasPermission: () => false,
  logout: async () => undefined,
  refreshCurrentUser: async () => null,
});

export function AdminAuthProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<CurrentAdminUserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const loadCurrentUser = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) {
      setCurrentUser(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/me", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        setCurrentUser(null);
        return null;
      }

      const data = (await response.json()) as CurrentAdminUserSummary;
      if (signal?.aborted) {
        return null;
      }

      setCurrentUser(data);
      return data;
    } catch (error) {
      if (signal?.aborted) {
        return null;
      }

      console.error("Failed to load current admin user:", error);
      setCurrentUser(null);
      return null;
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    const controller = new AbortController();

    void loadCurrentUser(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadCurrentUser, pathname]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleAuthChanged = () => {
      void loadCurrentUser();
    };

    window.addEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAuthChanged);

    return () => {
      window.removeEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [enabled, loadCurrentUser]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      currentUser,
      isLoading,
      hasPermission: (permission: string) =>
        currentUser?.permissions.includes(permission) ?? false,
      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
        setCurrentUser(null);
        notifyAdminAuthChanged();
      },
      refreshCurrentUser: loadCurrentUser,
    }),
    [currentUser, isLoading, loadCurrentUser]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}