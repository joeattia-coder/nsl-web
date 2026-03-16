"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  async function loadCurrentUser() {
    if (!enabled) {
      setCurrentUser(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/me", {
        cache: "no-store",
      });

      if (!response.ok) {
        setCurrentUser(null);
        return null;
      }

      const data = (await response.json()) as CurrentAdminUserSummary;
      setCurrentUser(data);
      return data;
    } catch (error) {
      console.error("Failed to load current admin user:", error);
      setCurrentUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!enabled) {
        if (!cancelled) {
          setCurrentUser(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/admin/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setCurrentUser(null);
          }

          return;
        }

        const data = (await response.json()) as CurrentAdminUserSummary;

        if (!cancelled) {
          setCurrentUser(data);
        }
      } catch (error) {
        console.error("Failed to load current admin user:", error);

        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, pathname]);

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
  }, [enabled, pathname]);

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
    [currentUser, isLoading]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}