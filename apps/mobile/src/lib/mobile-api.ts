import * as SecureStore from "expo-secure-store";

import { apiBaseUrl } from "./public-api";
import type {
  AuthSessionUser,
  DashboardResponse,
  HumanVerificationChallengeResponse,
  LatestTermsResponse,
  LiveMatchSessionResponse,
  LiveMatchSessionStatus,
  LiveMatchSessionSyncPayload,
  LoginResponse,
  MatchDetailResponse,
  MatchSummaryResponse,
  MobileHomeFeedResponse,
  PlayerProfileUpdatePayload,
  PublicFixtureGroupsResponse,
  ProfileResponse,
  PublicFixturesListResponse,
  PublicNewsListResponse,
  PublicVideosResponse,
  RegisterPayload,
  RegisterResponse,
  RegistrationAvailabilityField,
  RegistrationAvailabilityResponse,
  RankingsResponse,
  StandingsResponse,
  TournamentsResponse,
} from "../types/api";

const MOBILE_SESSION_STORAGE_KEY = "nsl.mobile.session-token";
const MOBILE_SESSION_HEADER = "x-nsl-session";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
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

class ApiRequestError extends Error {
  status: number;
  field?: string;

  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.field = field;
  }
}

type LiveMatchSessionCreatePayload = Pick<LiveMatchSessionSyncPayload, "summary" | "status"> & {
  initialState: LiveMatchSessionSyncPayload["scoringState"];
  adminOverride?: boolean;
};

type LiveMatchSessionCompletePayload = {
  adminOverride?: boolean;
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
    const genericMessage =
      (payload?.error as string | undefined) ||
      responseText ||
      `Request failed with status ${response.status}`;
    const detailedMessage = (payload?.details as string | undefined) || genericMessage;
    const message =
      response.status >= 500
        ? detailedMessage
        : genericMessage;

    throw new ApiRequestError(message, response.status, payload?.field as string | undefined);
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

  getRegistrationAvailability(field: RegistrationAvailabilityField, value: string) {
    return requestJson<RegistrationAvailabilityResponse>("/api/auth/register/availability", {
      query: {
        field,
        value,
      },
    });
  },

  getHumanVerificationChallenge() {
    return requestJson<HumanVerificationChallengeResponse>("/api/auth/human-verification");
  },

  register(payload: RegisterPayload) {
    return requestJson<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
    });
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

  getPublicNews(limit = 8) {
    return requestJson<PublicNewsListResponse>("/api/public/news", {
      query: {
        placement: "NEWS_SECTION",
        limit,
      },
    });
  },

  getPublicVideos(limit = 8) {
    return requestJson<PublicVideosResponse>("/api/public/videos", {
      query: {
        limit,
      },
    });
  },

  getPublicFixtures() {
    return requestJson<PublicFixturesListResponse>("/api/public/fixtures");
  },

  getPublicFixtureGroups() {
    return requestJson<PublicFixtureGroupsResponse>("/api/public/fixture-groups");
  },

  getPublicPlayerRankings() {
    return requestJson<RankingsResponse>("/api/public/player-rankings");
  },

  async getHomeFeed() {
    const [news, videos, fixtures, rankings] = await Promise.all([
      mobileApi.getPublicNews(6),
      mobileApi.getPublicVideos(6),
      mobileApi.getPublicFixtures(),
      mobileApi.getPublicPlayerRankings(),
    ]);

    return {
      news: news.articles,
      videos: videos.videos,
      fixtures: fixtures.fixtures,
      rankings: rankings.players,
    } satisfies MobileHomeFeedResponse;
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

  getLiveMatchSession(matchId: string) {
    return requestJson<LiveMatchSessionResponse>(`/api/my-matches/${encodeURIComponent(matchId)}/live-session`);
  },

  ensureLiveMatchSession(matchId: string, payload: LiveMatchSessionCreatePayload) {
    return requestJson<LiveMatchSessionResponse>(`/api/my-matches/${encodeURIComponent(matchId)}/live-session`, {
      method: "POST",
      body: payload,
    });
  },

  syncLiveMatchSession(matchId: string, payload: LiveMatchSessionSyncPayload) {
    return requestJson<LiveMatchSessionResponse>(`/api/my-matches/${encodeURIComponent(matchId)}/live-session`, {
      method: "PATCH",
      body: payload,
    });
  },

  resetLiveMatchSession(matchId: string) {
    return requestJson<{ ok: true }>(`/api/my-matches/${encodeURIComponent(matchId)}/live-session`, {
      method: "DELETE",
    });
  },

  adminResetLiveMatchSession(matchId: string) {
    return requestJson<{ ok: true }>(`/api/admin/matches/${encodeURIComponent(matchId)}/live-session/reset`, {
      method: "POST",
    });
  },

  completeLiveMatchSession(matchId: string, payload?: LiveMatchSessionCompletePayload) {
    return requestJson<LiveMatchSessionResponse & { finalized?: boolean }>(`/api/my-matches/${encodeURIComponent(matchId)}/live-session/complete`, {
      method: "POST",
      body: payload,
    });
  },

  submitMatchResult(matchId: string, payload: MatchSubmissionPayload) {
    return requestJson<{ ok: true }>(`/api/my-matches/${encodeURIComponent(matchId)}/submission`, {
      method: "POST",
      body: payload,
    });
  },

  submitLiveMatchResult(matchId: string) {
    return requestJson<{ ok: true }>(`/api/my-matches/${encodeURIComponent(matchId)}/submission`, {
      method: "POST",
      body: {
        source: "liveSession",
      },
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

export { ApiRequestError };