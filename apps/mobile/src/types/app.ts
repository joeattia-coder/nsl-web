export type UserRole = "player" | "tournament_manager" | "league_admin";

export type LeagueBrowseSection = "tournaments" | "results" | "rankings" | "groups";

export type MatchStatus = "Scheduled" | "Completed" | "In Progress";

export type MainTabParamList = {
  Home: undefined;
  Tournaments: undefined;
  Matches: undefined;
  Score: { matchId?: string } | undefined;
  Profile: undefined;
  Overview: undefined;
  League: undefined;
  TournamentDetail: { tournamentId: string };
  LeagueContent: { initialSection?: LeagueBrowseSection } | undefined;
  ChangePassword: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  MatchScoring: { matchId: string };
  TournamentDetail: { tournamentId: string };
  LeagueContent: { initialSection?: LeagueBrowseSection } | undefined;
  ChangePassword: undefined;
};

export type TabRouteName = keyof MainTabParamList;

export type IconName = string;

export type StatTone = "accent" | "gold" | "neutral";

export interface RoleTabDefinition {
  routeName: TabRouteName;
  label: string;
  icon: IconName;
}

export interface RoleConfig {
  defaultTab: TabRouteName;
  tabs: RoleTabDefinition[];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  middleInitial: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

export interface AppUser {
  id: string;
  role: UserRole;
  fullName: string;
  subtitle: string;
  email: string;
  initials: string;
  username?: string | null;
  linkedPlayerId?: string | null;
  isAdmin?: boolean;
  isPlayer?: boolean;
}

export interface MockUser extends AppUser {
  profile: UserProfile;
}

export interface PlayerStat {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: StatTone;
}

export interface PerformanceMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
  progress: number;
}

export interface EloHistoryEntry {
  id: string;
  title: string;
  dateLabel: string;
  rating: number;
  delta: number;
  summary: string;
}

export interface TournamentSummary {
  id: string;
  name: string;
  division: string;
  venue: string;
  dateLabel: string;
  status: string;
  registrationNote: string;
  shortDescription: string;
  isRegistered: boolean;
  startDate?: string | null;
  endDate?: string | null;
  registrationDeadline?: string | null;
  participantType?: string;
  snookerFormat?: string | null;
}

export interface GroupStandingRow {
  id: string;
  position: number;
  player: string;
  matches: number;
  wins: number;
  frames: string;
  points: number;
  form: string;
}

export interface RankingRow {
  id: string;
  rank: number;
  player: string;
  elo: number;
  wins: number;
  movement: "up" | "down" | "same";
}

export interface MatchPlayer {
  name: string;
  initials: string;
  photoUrl?: string | null;
}

export interface MatchItem {
  id: string;
  tournamentName: string;
  venue: string;
  stage: string;
  dateTime: string | null;
  status: MatchStatus;
  homePlayer: MatchPlayer;
  awayPlayer: MatchPlayer;
  scoreLine: string;
  canSubmitResult: boolean;
  pendingMode?: "none" | "awaitingYourReview" | "submittedByYou";
  pendingLabel?: string | null;
  currentEntryId?: string;
  bestOfFrames?: number;
  snookerFormat?: string | null;
}

export interface ScoringSession {
  id: string;
  opponent: string;
  venue: string;
  startedAt: string;
  tableLabel: string;
  status: string;
}

export interface LeagueResultCard {
  id: string;
  title: string;
  meta: string;
  status: string;
  summary: string;
}

export interface LeagueRankingCard {
  id: string;
  position: number;
  player: string;
  points: number;
  movement: string;
}

export interface DivisionGroupCard {
  id: string;
  title: string;
  leader: string;
  venue: string;
  update: string;
}

export interface RoleOverviewMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
}