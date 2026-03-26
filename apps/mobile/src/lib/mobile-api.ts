import * as SecureStore from "expo-secure-store";

import { apiBaseUrl } from "./public-api";
import type {
  AuthSessionUser,
  DashboardResponse,
  LatestTermsResponse,
  LoginResponse,
  MatchDetailResponse,
  MatchSummaryResponse,
  PlayerProfileUpdatePayload,
  ProfileResponse,
  RankingsResponse,
  StandingsResponse,
  TournamentsResponse,
} from "../types/api";

const MOBILE_SESSION_STORAGE_KEY = "nsl.mobile.session-token";
const MOBILE_SESSION_HEADER = "x-nsl-session";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
};

type MatchSubmissionPayload = {
  startDateTime?: string | null;
  endDateTime?: string | null;
  homeScore: number;
  awayScore: number;
  winnerEntryId?: string | null;
  homeHighBreaks: Array<number | null>;
  awayHighBreaks: Array<number | null>;
  summaryNote?: string | null;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function createUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${normalizeBaseUrl(apiBaseUrl)}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const sessionToken = await getStoredSessionToken();
  const response = await fetch(createUrl(path, options.query), {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(sessionToken ? { [MOBILE_SESSION_HEADER]: sessionToken } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  const responseText = await response.text();
  const payload = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : null;

  if (!response.ok) {
    const message =
      (payload?.error as string | undefined) ||
      (payload?.details as string | undefined) ||
      responseText ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

let cachedSessionToken: string | null | undefined;

async function getStoredSessionToken() {
  if (cachedSessionToken !== undefined) {
    return cachedSessionToken;
  }

  cachedSessionToken = await SecureStore.getItemAsync(MOBILE_SESSION_STORAGE_KEY);
  return cachedSessionToken;
}

async function setStoredSessionToken(value: string | null) {
  cachedSessionToken = value;

  if (value) {
    await SecureStore.setItemAsync(MOBILE_SESSION_STORAGE_KEY, value);
    return;
  }

  await SecureStore.deleteItemAsync(MOBILE_SESSION_STORAGE_KEY);
}

async function getLatestTermsVersionId() {
  const response = await requestJson<LatestTermsResponse>("/api/terms/latest");
  return response.version.exists ? response.version.id : null;
}

export const mobileApi = {
  getSession() {
    return requestJson<AuthSessionUser>("/api/auth/me");
  },

  async login(identifier: string, password: string) {
    const acceptedTermsVersionId = await getLatestTermsVersionId();

    const response = await requestJson<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: {
        identifier,
        password,
        acceptedTermsVersionId,
      },
    });

    await setStoredSessionToken(response.sessionToken);
    return response;
  },

  async logout() {
    const response = await requestJson<{ ok: true }>("/api/auth/logout", {
      method: "POST",
    });

    await setStoredSessionToken(null);
    return response;
  },

  changePassword(currentPassword: string, newPassword: string) {
    return requestJson<{ ok: true }>("/api/auth/change-password", {
      method: "POST",
      body: {
        currentPassword,
        newPassword,
      },
    });
  },

  getProfile() {
    return requestJson<ProfileResponse>("/api/profile");
  },

  updateProfile(payload: PlayerProfileUpdatePayload) {
    return requestJson<{ ok: true; player: ProfileResponse["player"] }>("/api/profile", {
      method: "PATCH",
      body: payload,
    });
  },

  getDashboard() {
    return requestJson<DashboardResponse>("/api/player-dashboard");
  },

  getMyTournaments() {
    return requestJson<TournamentsResponse>("/api/my-tournaments");
  },

  getPublicTournaments() {
    return requestJson<TournamentsResponse>("/api/public/tournaments");
  },

  getTournamentStandings(tournamentId: string) {
    return requestJson<StandingsResponse>("/api/public/standings", {
      query: {
        fixtureGroupIdentifier: tournamentId,
      },
    });
  },

  getTournamentRankings(tournamentId: string) {
    return requestJson<RankingsResponse>("/api/public/player-rankings", {
      query: {
        tournamentId,
      },
    });
  },

  getMyMatches() {
    return requestJson<MatchSummaryResponse>("/api/my-matches");
  },

  getMyMatch(matchId: string) {
    return requestJson<MatchDetailResponse>(`/api/my-matches/${encodeURIComponent(matchId)}`);
  },

  submitMatchResult(matchId: string, payload: MatchSubmissionPayload) {
    return requestJson<{ ok: true }>(`/api/my-matches/${encodeURIComponent(matchId)}/submission`, {
      method: "POST",
      body: payload,
    });
  },

  approveMatchResult(matchId: string) {
    return requestJson<{ ok: true }>(`/api/my-matches/${encodeURIComponent(matchId)}/submission/approve`, {
      method: "POST",
    });
  },

  disputeMatchResult(matchId: string, disputeReason: string) {
    return requestJson<{ ok: true }>(`/api/my-matches/${encodeURIComponent(matchId)}/submission/dispute`, {
      method: "POST",
      body: {
        disputeReason,
      },
    });
  },
};