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
};

export type PublicLiveMatchResponse = {
  item: PublicLiveMatchSnapshot;
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