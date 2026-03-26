import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { mobileApi } from "../lib/mobile-api";
import type { AuthSessionUser } from "../types/api";
import type { AppUser, UserRole } from "../types/app";

type LoginPayload = {
  emailOrUsername: string;
  password: string;
};

type AppSessionContextValue = {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  currentRole: UserRole;
  availableRoles: UserRole[];
  currentUser: AppUser;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  refreshSession: () => Promise<AuthSessionUser | null>;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

function buildInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
}

function mapAvailableRoles(user: AuthSessionUser | null) {
  if (!user) {
    return ["player"] satisfies UserRole[];
  }

  const roles: UserRole[] = [];

  if (user.isPlayer) {
    roles.push("player");
  }

  if (user.isAdmin) {
    roles.push("league_admin");
  }

  return roles.length > 0 ? roles : (["player"] satisfies UserRole[]);
}

function mapCurrentRole(user: AuthSessionUser | null, preferredRole: UserRole | null) {
  const availableRoles = mapAvailableRoles(user);

  if (preferredRole && availableRoles.includes(preferredRole)) {
    return preferredRole;
  }

  return availableRoles[0] ?? "player";
}

function mapCurrentUser(user: AuthSessionUser | null, role: UserRole): AppUser {
  const fullName = user?.displayName?.trim() || "National Snooker League";
  const email = user?.email?.trim() || user?.username?.trim() || "player@nsl.local";

  return {
    id: user?.id ?? "guest",
    role,
    fullName,
    subtitle:
      role === "league_admin"
        ? "League operations and competition control"
        : "Player-facing matchday control and score submission",
    email,
    username: user?.username ?? null,
    linkedPlayerId: user?.linkedPlayerId ?? null,
    isAdmin: user?.isAdmin ?? false,
    isPlayer: user?.isPlayer ?? false,
    initials: buildInitials(fullName),
  };
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<AuthSessionUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole>("player");

  const availableRoles = useMemo(() => mapAvailableRoles(sessionUser), [sessionUser]);

  const refreshSession = async () => {
    try {
      const user = await mobileApi.getSession();
      setSessionUser(user);
      setCurrentRole((previous) => mapCurrentRole(user, previous));
      return user;
    } catch {
      setSessionUser(null);
      setCurrentRole("player");
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const user = await mobileApi.getSession();

        if (!isMounted) {
          return;
        }

        setSessionUser(user);
        setCurrentRole(mapCurrentRole(user, null));
      } catch {
        if (!isMounted) {
          return;
        }

        setSessionUser(null);
        setCurrentRole("player");
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async ({ emailOrUsername, password }: LoginPayload) => {
    await mobileApi.login(emailOrUsername, password);
    const user = await refreshSession();

    if (!user) {
      throw new Error("Sign-in completed but no authenticated session was available to the mobile app.");
    }
  };

  const logout = async () => {
    await mobileApi.logout();
    setSessionUser(null);
    setCurrentRole("player");
  };

  const switchRole = (role: UserRole) => {
    if (availableRoles.includes(role)) {
      setCurrentRole(role);
    }
  };

  const currentUser = useMemo(() => mapCurrentUser(sessionUser, currentRole), [currentRole, sessionUser]);

  return (
    <AppSessionContext.Provider
      value={{
        isAuthenticated: Boolean(sessionUser),
        isBootstrapping,
        currentRole,
        availableRoles,
        currentUser,
        login,
        logout,
        switchRole,
        refreshSession,
      }}
    >
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }

  return context;
}