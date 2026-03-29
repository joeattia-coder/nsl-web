import type { MatchStatus } from "./app";
import type { MatchScoringState, PlayerSide } from "./scoring";
import type { PublicFixture, PublicFixturesResponse, PublicNewsArticle, PublicNewsResponse } from "@nsl/shared";

export type AuthSessionUser = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string;
  linkedPlayerId: string | null;
  isGlobalAdmin: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  permissions: string[];
  permissionGrants: Array<{
    permissionKey: string;
    scopeType: string;
    scopeId: string;
  }>;
  permissionOverrides: Array<{
    permissionKey: string;
    effect: "ALLOW" | "DENY";
    scopeType: string;
    scopeId: string;
  }>;
  source: "session" | "mobile-header";
};

export type LatestTermsResponse = {
  version: {
    id: string | null;
    title: string;
    contentHtml: string;
    publishedAt: string | null;
    publishedAtLabel: string | null;
    exists: boolean;
  };
};

export type LoginResponse = {
  ok: true;
  nextPath: string;
  sessionToken: string;
};

export type RegistrationAvailabilityField = "email" | "username";

export type RegistrationAvailabilityResponse = {
  field: RegistrationAvailabilityField;
  available: boolean;
  duplicate: boolean;
  normalizedValue?: string;
};

export type HumanVerificationChallengeResponse = {
  ok: true;
  challenge: {
    prompt: string;
    token: string;
  };
};

export type RegisterPayload = {
  firstName: string;
  middleInitial: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  email: string;
  username: string;
  password: string;
  verificationToken: string;
  verificationAnswer: string;
  website: string;
};

export type RegisterResponse = {
  ok: true;
  userId: string;
  message: string;
  verificationLink: string | null;
  delivery: "email" | "development-link";
};

export type ProfileResponse = {
  user: {
    id: string;
    displayName: string;
    email: string | null;
    username: string | null;
  };
  player: {
    id: string;
    firstName: string;
    middleInitial: string | null;
    lastName: string;
    dateOfBirth: string | null;
    emailAddress: string | null;
    phoneNumber: string | null;
    photoUrl: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    stateProvince: string | null;
    country: string | null;
    postalCode: string | null;
    updatedAt: string;
  };
};

export type PlayerProfileUpdatePayload = {
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  dateOfBirth: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  postalCode: string | null;
};

export type DashboardResponse = {
  user: {
    id: string;
    displayName: string;
    email: string | null;
    username: string | null;
  };
  dashboard: {
    player: {
      id: string;
      fullName: string;
      country: string | null;
      photoUrl: string | null;
      eloRating: number;
      updatedAt: string;
    };
    rankingPosition: number | null;
    stats: {
      id: string;
      firstName: string;
      lastName: string;
      fullName: string;
      name: string;
      matchesPlayed: number;
      matchesWon: number;
      matchesLost: number;
      framesWon: number;
      framesLost: number;
      frameDifferential: number;
      highBreak: number;
      highBreakCumulative: number;
      points: number;
      eloRating: number;
      photoUrl?: string;
      country?: string;
    } | null;
    winPercentage: number;
    eloHistory: Array<{
      id: string;
      ratingBefore: number;
      ratingAfter: number;
      ratingChange: number;
      matchesPlayed: number;
      expectedScore: number;
      actualScore: number;
      opponentAverage: number;
      matchDate: string | null;
      tournamentName: string;
      roundName: string;
      homeScore: number | null;
      awayScore: number | null;
      homeEntryName: string;
      awayEntryName: string;
    }>;
  };
};

export type MobileTournamentRecord = {
  id: string;
  tournamentName: string;
  status: string;
  seasonName: string | null;
  venueName: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  description: string | null;
  snookerFormat: string | null;
  participantType: string;
};

export type TournamentsResponse = {
  tournaments: MobileTournamentRecord[];
};

export type PublicLeagueGroupsResponse = {
  count: number;
  groups: Array<{
    id: string;
    fixtureGroupIdentifier: string;
    fixtureGroupDesc: string;
    seasonId: string | null;
    standings: StandingsResponse;
  }>;
};

export type PendingSubmissionMode = "none" | "awaitingYourReview" | "submittedByYou";

export type MatchSummaryResponse = {
  matches: Array<{
    id: string;
    tournamentName: string;
    venue: string;
    stage: string;
    dateTime: string | null;
    status: MatchStatus;
    homePlayer: {
      name: string;
      initials: string;
      photoUrl: string | null;
    };
    awayPlayer: {
      name: string;
      initials: string;
      photoUrl: string | null;
    };
    scoreLine: string;
    canSubmitResult: boolean;
    pendingMode: PendingSubmissionMode;
    pendingLabel: string | null;
    currentEntryId: string;
    bestOfFrames: number;
    snookerFormat: "REDS_6" | "REDS_10" | "REDS_15";
  }>;
};

export type MatchDetailResponse = {
  match: {
    id: string;
    tournamentId: string;
    tournamentName: string;
    venue: string;
    stage: string;
    dateTime: string | null;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    resultSubmittedAt: string | null;
    bestOfFrames: number;
    snookerFormat: "REDS_6" | "REDS_10" | "REDS_15";
    currentSide: "home" | "away";
    currentEntryId: string;
    opponentEntryId: string;
    homeEntry: {
      id: string;
      label: string;
      members: Array<{
        id: string;
        fullName: string;
        initials: string;
        photoUrl: string | null;
        country: string | null;
      }>;
    };
    awayEntry: {
      id: string;
      label: string;
      members: Array<{
        id: string;
        fullName: string;
        initials: string;
        photoUrl: string | null;
        country: string | null;
      }>;
    };
    frames: Array<{
      id: string;
      frameNumber: number;
      winnerEntryId: string | null;
      homePoints: number | null;
      awayPoints: number | null;
      homeHighBreak: number | null;
      awayHighBreak: number | null;
      breaks: Array<{
        id: string;
        breakValue: number;
        playerId: string;
        playerName: string;
        side: "home" | "away";
      }>;
    }>;
    pendingSubmission: {
      id: string;
      mode: PendingSubmissionMode;
      homeScore: number;
      awayScore: number;
      winnerEntryId: string | null;
      summaryNote: string | null;
      submittedAt: string;
      proposedMatchDate: string | null;
      proposedMatchTime: string | null;
      proposedEndedAt: string | null;
      frames: Array<{
        frameNumber: number;
        homeHighBreak: number | null;
        awayHighBreak: number | null;
      }>;
    } | null;
  };
};

export type LiveMatchSessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";

export type LiveMatchSessionSummary = {
  homeScore: number | null;
  awayScore: number | null;
  currentFrameNumber: number | null;
  currentFrameHomePoints: number | null;
  currentFrameAwayPoints: number | null;
  activeSide: PlayerSide | null;
};

export type LiveMatchSessionParticipantState = {
  startedAt: string | null;
  completedAt: string | null;
};

export type LiveMatchSessionRecord = {
  id: string;
  matchId: string;
  status: LiveMatchSessionStatus;
  version: number;
  scoringState: MatchScoringState | null;
  summary: LiveMatchSessionSummary;
  participants: {
    home: LiveMatchSessionParticipantState;
    away: LiveMatchSessionParticipantState;
  };
  finalizedAt: string | null;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LiveMatchSessionResponse = {
  session: LiveMatchSessionRecord | null;
};

export type LiveMatchSessionSyncPayload = {
  baseVersion: number;
  scoringState: MatchScoringState;
  summary: {
    homeScore: number;
    awayScore: number;
    currentFrameNumber: number;
    currentFrameHomePoints: number;
    currentFrameAwayPoints: number;
    activeSide: PlayerSide | null;
    isComplete: boolean;
  };
  status?: LiveMatchSessionStatus;
  adminOverride?: boolean;
};

export type StandingsResponse = {
  fixtureGroupIdentifier: string;
  groupCount: number;
  groups: Array<{
    standingsDesc: string;
    count: number;
    rows: Array<{
      rank: number;
      teamName: string;
      playerId: string | null;
      played: number;
      won: number;
      tied: number;
      lost: number;
      framesFor: number;
      framesAgainst: number;
      diff: number;
      points: number;
    }>;
  }>;
};

export type RankingsResponse = {
  players: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    matchesPlayed: number;
    points: number;
    matchesWon: number;
    matchesLost: number;
    framesWon: number;
    framesLost: number;
    frameDifferential: number;
    highBreak: number;
    highBreakCumulative: number;
    eloRating?: number;
    photoUrl?: string;
    country?: string;
  }>;
};

export type PublicNewsListResponse = PublicNewsResponse;

export type PublicHomeVideo = {
  id: string;
  title: string;
  sourceType: "YOUTUBE" | "UPLOAD";
  videoUrl: string;
  carouselSortOrder: number | null;
  embedUrl: string;
  watchUrl: string;
};

export type PublicVideosResponse = {
  videos: PublicHomeVideo[];
};

export type PublicFixturesListResponse = PublicFixturesResponse;

export type PublicRankingPlayer = RankingsResponse["players"][number];

export type MobileHomeFeedResponse = {
  news: PublicNewsArticle[];
  videos: PublicHomeVideo[];
  fixtures: PublicFixture[];
  rankings: PublicRankingPlayer[];
};