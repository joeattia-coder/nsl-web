import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { deviceSignIn, type DeviceSignInStatus } from "../lib/device-sign-in";
import { mobileApi } from "../lib/mobile-api";
import type { AuthSessionUser } from "../types/api";
import type { AppUser, UserRole } from "../types/app";

type LoginPayload = {
  emailOrUsername: string;
  password: string;
};

const defaultDeviceSignInStatus: DeviceSignInStatus = {
  isSupported: false,
  isEnrolled: false,
  hasCredentials: false,
};

type AppSessionContextValue = {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  currentRole: UserRole;
  availableRoles: UserRole[];
  currentUser: AppUser;
  deviceSignInStatus: DeviceSignInStatus;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithDevice: () => Promise<void>;
  logout: () => Promise<void>;
  enableDeviceSignIn: (payload: LoginPayload) => Promise<void>;
  disableDeviceSignIn: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  refreshSession: () => Promise<AuthSessionUser | null>;
  refreshDeviceSignInStatus: () => Promise<DeviceSignInStatus>;
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
  const email = user?.email?.trim() || user?.username?.trim() || "guest@nsl.local";

  return {
    id: user?.id ?? "guest",
    role,
    fullName,
    subtitle:
      !user
        ? "Public fixtures, rankings, and league updates before sign-in"
        : role === "league_admin"
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
  const [deviceSignInStatus, setDeviceSignInStatus] = useState<DeviceSignInStatus>(defaultDeviceSignInStatus);

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

  const refreshDeviceSignInStatus = async () => {
    const status = await deviceSignIn.getStatus();
    setDeviceSignInStatus(status);
    return status;
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const [user, status] = await Promise.all([
          mobileApi.getSession(),
          deviceSignIn.getStatus(),
        ]);

        if (!isMounted) {
          return;
        }

        setSessionUser(user);
        setCurrentRole(mapCurrentRole(user, null));
        setDeviceSignInStatus(status);
      } catch {
        if (!isMounted) {
          return;
        }

        setSessionUser(null);
        setCurrentRole("player");
        const status = await deviceSignIn.getStatus().catch(() => defaultDeviceSignInStatus);

        if (isMounted) {
          setDeviceSignInStatus(status);
        }
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

  const loginWithDevice = async () => {
    const credentials = await deviceSignIn.getCredentialsWithPrompt();

    await mobileApi.login(credentials.identifier, credentials.password);
    const user = await refreshSession();

    if (!user) {
      throw new Error("Device sign-in completed but no authenticated session was available to the mobile app.");
    }
  };

  const enableDeviceSignIn = async ({ emailOrUsername, password }: LoginPayload) => {
    await deviceSignIn.storeCredentials(emailOrUsername.trim(), password);
    await refreshDeviceSignInStatus();
  };

  const logout = async () => {
    await mobileApi.logout();
    setSessionUser(null);
    setCurrentRole("player");
  };

  const disableDeviceSignIn = async () => {
    await deviceSignIn.clearCredentials();
    await refreshDeviceSignInStatus();
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
        deviceSignInStatus,
        login,
        loginWithDevice,
        logout,
        enableDeviceSignIn,
        disableDeviceSignIn,
        switchRole,
        refreshSession,
        refreshDeviceSignInStatus,
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