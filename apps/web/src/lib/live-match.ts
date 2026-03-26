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