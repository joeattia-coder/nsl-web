import type { AdminPlayerInviteState } from "@/lib/admin-player-invitations";

export type LiveMatchCoreSnapshot = {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  matchStatus: string;
  scheduleStatus: string;
  updatedAt: string;
};

export type PublicLiveMatchSnapshot = LiveMatchCoreSnapshot & {
  fixtureGroupIdentifier: string;
  publicNote: string | null;
  liveSessionStatus: string | null;
  currentFrameNumber: number | null;
  currentFrameHomePoints: number | null;
  currentFrameAwayPoints: number | null;
  activeSide: "home" | "away" | null;
};

export type PublicLiveFrameSummary = {
  frameNumber: number;
  homePoints: number;
  awayPoints: number;
  homeHighBreak: number | null;
  awayHighBreak: number | null;
  homeFouls: number;
  awayFouls: number;
  winnerSide: "home" | "away" | null;
  isComplete: boolean;
  isCurrent: boolean;
};

export type PublicLiveBreakState = {
  side: "home" | "away";
  points: number;
  balls: string[];
};

export type PublicLiveBroadcastState = {
  startedAt: string | null;
  currentFrameNumber: number | null;
  redsRemaining: number | null;
  expectedShot: string | null;
  activeSide: "home" | "away" | null;
  currentBreak: PublicLiveBreakState | null;
  highestBreak: {
    home: number | null;
    away: number | null;
  };
  totalFouls: {
    home: number;
    away: number;
  };
  frames: PublicLiveFrameSummary[];
};

export type PublicLiveMatchResponse = {
  item: PublicLiveMatchSnapshot;
  details?: PublicLiveBroadcastState | null;
  serverTime: string;
};

export type PublicLiveMatchListResponse = {
  items: PublicLiveMatchSnapshot[];
  serverTime: string;
};

export type AdminMatchesLiveSnapshot = {
  id: string;
  homeScore: number | null;
  awayScore: number | null;
  venueName: string;
  matchDate: string;
  updatedAt: string;
};

export type AdminMatchesLiveResponse = {
  items: AdminMatchesLiveSnapshot[];
  serverTime: string;
};

export type TournamentMatchesLiveSnapshot = LiveMatchCoreSnapshot & {
  winnerName: string;
  bestOfFrames: number;
  matchDate: string;
  matchTime: string;
  venueName: string;
};

export type TournamentMatchesLiveResponse = {
  items: TournamentMatchesLiveSnapshot[];
  serverTime: string;
};

export type AdminPlayerLiveTournament = {
  id: string;
  name: string;
};

export type AdminPlayerLiveSnapshot = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country: string;
  photoUrl: string;
  linkedUserId: string | null;
  inviteState: AdminPlayerInviteState;
  inviteLabel: string;
  inviteMeta: string | null;
  inviteUpdatedAt: string | null;
  tournaments: AdminPlayerLiveTournament[];
};

export type AdminPlayersLiveResponse = {
  items: AdminPlayerLiveSnapshot[];
  serverTime: string;
};