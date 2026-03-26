import type {
  DivisionGroupCard,
  EloHistoryEntry,
  GroupStandingRow,
  LeagueRankingCard,
  LeagueResultCard,
  MatchItem,
  MockUser,
  PerformanceMetric,
  PlayerStat,
  RankingRow,
  RoleOverviewMetric,
  ScoringSession,
  TournamentSummary,
  UserRole,
} from "../types/app";

export const mockUsersByRole: Record<UserRole, MockUser> = {
  player: {
    id: "player-1",
    role: "player",
    fullName: "Amir Attia",
    subtitle: "Locked in for Cairo Premier Division fixtures and ranking climbs.",
    email: "amir.attia@nsl.example",
    initials: "AA",
    profile: {
      firstName: "Amir",
      lastName: "Attia",
      middleInitial: "H",
      dateOfBirth: "1994-08-14",
      email: "amir.attia@nsl.example",
      phone: "+20 100 555 0123",
      addressLine1: "14 El Gezirah Street",
      addressLine2: "Zamalek",
      city: "Cairo",
      stateProvince: "Cairo Governorate",
      postalCode: "11561",
      country: "Egypt",
    },
  },
  tournament_manager: {
    id: "manager-1",
    role: "tournament_manager",
    fullName: "Nadia Soliman",
    subtitle: "Managing draws, venues, and live division operations across NSL events.",
    email: "nadia.soliman@nsl.example",
    initials: "NS",
    profile: {
      firstName: "Nadia",
      lastName: "Soliman",
      middleInitial: "R",
      dateOfBirth: "1988-04-03",
      email: "nadia.soliman@nsl.example",
      phone: "+20 122 000 7750",
      addressLine1: "88 Corniche El Nil",
      addressLine2: "Garden City",
      city: "Cairo",
      stateProvince: "Cairo Governorate",
      postalCode: "11519",
      country: "Egypt",
    },
  },
  league_admin: {
    id: "admin-1",
    role: "league_admin",
    fullName: "Karim Fawzy",
    subtitle: "Overseeing competition structure, sanctions, league settings, and player operations.",
    email: "karim.fawzy@nsl.example",
    initials: "KF",
    profile: {
      firstName: "Karim",
      lastName: "Fawzy",
      middleInitial: "M",
      dateOfBirth: "1985-11-27",
      email: "karim.fawzy@nsl.example",
      phone: "+20 101 404 2200",
      addressLine1: "2 Tahrir Square",
      addressLine2: "Downtown",
      city: "Cairo",
      stateProvince: "Cairo Governorate",
      postalCode: "11511",
      country: "Egypt",
    },
  },
};

export const playerStats: PlayerStat[] = [
  { id: "ranking", label: "Ranking", value: "#12", helper: "Premier division standing", tone: "gold" },
  { id: "elo", label: "Elo Rating", value: "1684", helper: "+26 over 30 days", tone: "accent" },
  { id: "win-rate", label: "Win Rate", value: "68%", helper: "13 wins from last 19", tone: "neutral" },
  { id: "high-break", label: "High Break", value: "104", helper: "Season best clearance", tone: "gold" },
];

export const performanceMetrics: PerformanceMetric[] = [
  { id: "form", label: "Form", value: "4W / 1L", helper: "Strong close-outs in deciding frames", progress: 0.82 },
  { id: "safety", label: "Safety Efficiency", value: "78%", helper: "Forcing low-percentage responses", progress: 0.78 },
  { id: "long-pot", label: "Long Pot Success", value: "61%", helper: "Confidence rising under pressure", progress: 0.61 },
];

export const eloHistory: EloHistoryEntry[] = [
  {
    id: "elo-1",
    title: "Premier Division Night 6",
    dateLabel: "Mar 21",
    rating: 1684,
    delta: 14,
    summary: "Beat Hany Saad 4-2 after overturning a two-frame deficit.",
  },
  {
    id: "elo-2",
    title: "League Cup Qualifier",
    dateLabel: "Mar 17",
    rating: 1670,
    delta: 8,
    summary: "Clean 3-0 result with a 78 break in the opening frame.",
  },
  {
    id: "elo-3",
    title: "Cairo Open Group Stage",
    dateLabel: "Mar 10",
    rating: 1662,
    delta: -4,
    summary: "Dropped a deciding frame against the group leader.",
  },
];

export const tournaments: TournamentSummary[] = [
  {
    id: "tour-1",
    name: "Cairo Premier League",
    division: "Division A",
    venue: "NSL Arena - Hall 1",
    dateLabel: "Apr 2 - May 18",
    status: "Registered",
    registrationNote: "Confirmed roster slot",
    shortDescription: "Top-flight race with weekly fixtures and live ranking movement.",
    isRegistered: true,
  },
  {
    id: "tour-2",
    name: "League Cup Spring",
    division: "Championship Bracket",
    venue: "Alexandria Sports Club",
    dateLabel: "Apr 12 - Apr 28",
    status: "Registered",
    registrationNote: "Seeded into top half",
    shortDescription: "Knockout cup built for high-pressure short-format matches.",
    isRegistered: true,
  },
  {
    id: "tour-3",
    name: "NSL National Masters",
    division: "Open Draw",
    venue: "Heliopolis Snooker Lounge",
    dateLabel: "May 4 - May 19",
    status: "Open",
    registrationNote: "4 days left to enter",
    shortDescription: "All-league championship with seeded main bracket positions.",
    isRegistered: false,
  },
  {
    id: "tour-4",
    name: "Delta Invitational",
    division: "Division B",
    venue: "Mansoura Cue House",
    dateLabel: "May 20 - May 27",
    status: "Open",
    registrationNote: "Priority window for ranked players",
    shortDescription: "Compact travel event featuring round-robin group play.",
    isRegistered: false,
  },
];

export const tournamentGroupsById: Record<string, GroupStandingRow[]> = {
  "tour-1": [
    { id: "g1-1", position: 1, player: "Amir Attia", matches: 6, wins: 5, frames: "22-11", points: 15, form: "WWWLW" },
    { id: "g1-2", position: 2, player: "Hany Saad", matches: 6, wins: 4, frames: "19-13", points: 12, form: "WLWWW" },
    { id: "g1-3", position: 3, player: "Omar Lotfy", matches: 6, wins: 3, frames: "16-15", points: 9, form: "LWWLL" },
    { id: "g1-4", position: 4, player: "Tarek Nabil", matches: 6, wins: 1, frames: "9-22", points: 3, form: "LLWLL" },
  ],
  "tour-2": [
    { id: "g2-1", position: 1, player: "Amir Attia", matches: 3, wins: 3, frames: "12-5", points: 9, form: "WWW" },
    { id: "g2-2", position: 2, player: "Youssef Ali", matches: 3, wins: 2, frames: "9-7", points: 6, form: "LWW" },
    { id: "g2-3", position: 3, player: "Bassem Adel", matches: 3, wins: 1, frames: "6-10", points: 3, form: "WLL" },
    { id: "g2-4", position: 4, player: "Mahmoud Saleh", matches: 3, wins: 0, frames: "4-9", points: 0, form: "LLL" },
  ],
  "tour-3": [
    { id: "g3-1", position: 1, player: "Karim Farid", matches: 4, wins: 4, frames: "16-6", points: 12, form: "WWWW" },
    { id: "g3-2", position: 2, player: "Ahmed Nader", matches: 4, wins: 2, frames: "11-9", points: 6, form: "WLWL" },
    { id: "g3-3", position: 3, player: "Ramy Tamer", matches: 4, wins: 1, frames: "8-12", points: 3, form: "LLWW" },
    { id: "g3-4", position: 4, player: "Mostafa Adel", matches: 4, wins: 1, frames: "7-15", points: 3, form: "WLLL" },
  ],
  "tour-4": [
    { id: "g4-1", position: 1, player: "Samir Kamel", matches: 5, wins: 4, frames: "18-8", points: 12, form: "WWLWW" },
    { id: "g4-2", position: 2, player: "Aly Hassan", matches: 5, wins: 3, frames: "16-11", points: 9, form: "LWWWL" },
    { id: "g4-3", position: 3, player: "Omar Reda", matches: 5, wins: 2, frames: "11-13", points: 6, form: "WLLWW" },
    { id: "g4-4", position: 4, player: "Tamer Hegazy", matches: 5, wins: 1, frames: "8-17", points: 3, form: "LLWL" },
  ],
};

export const tournamentRankingsById: Record<string, RankingRow[]> = {
  "tour-1": [
    { id: "r1-1", rank: 1, player: "Amir Attia", elo: 1684, wins: 5, movement: "up" },
    { id: "r1-2", rank: 2, player: "Hany Saad", elo: 1668, wins: 4, movement: "same" },
    { id: "r1-3", rank: 3, player: "Omar Lotfy", elo: 1642, wins: 3, movement: "down" },
    { id: "r1-4", rank: 4, player: "Tarek Nabil", elo: 1577, wins: 1, movement: "same" },
  ],
  "tour-2": [
    { id: "r2-1", rank: 1, player: "Amir Attia", elo: 1684, wins: 3, movement: "up" },
    { id: "r2-2", rank: 2, player: "Youssef Ali", elo: 1630, wins: 2, movement: "up" },
    { id: "r2-3", rank: 3, player: "Bassem Adel", elo: 1601, wins: 1, movement: "same" },
    { id: "r2-4", rank: 4, player: "Mahmoud Saleh", elo: 1548, wins: 0, movement: "down" },
  ],
  "tour-3": [
    { id: "r3-1", rank: 1, player: "Karim Farid", elo: 1722, wins: 4, movement: "up" },
    { id: "r3-2", rank: 2, player: "Ahmed Nader", elo: 1661, wins: 2, movement: "same" },
    { id: "r3-3", rank: 3, player: "Ramy Tamer", elo: 1610, wins: 1, movement: "down" },
    { id: "r3-4", rank: 4, player: "Mostafa Adel", elo: 1582, wins: 1, movement: "same" },
  ],
  "tour-4": [
    { id: "r4-1", rank: 1, player: "Samir Kamel", elo: 1654, wins: 4, movement: "up" },
    { id: "r4-2", rank: 2, player: "Aly Hassan", elo: 1635, wins: 3, movement: "same" },
    { id: "r4-3", rank: 3, player: "Omar Reda", elo: 1596, wins: 2, movement: "same" },
    { id: "r4-4", rank: 4, player: "Tamer Hegazy", elo: 1542, wins: 1, movement: "down" },
  ],
};

export const matches: MatchItem[] = [
  {
    id: "match-1",
    tournamentName: "Cairo Premier League",
    venue: "NSL Arena - Table 3",
    stage: "Round 7",
    dateTime: "2026-03-28T20:00:00.000Z",
    status: "Scheduled",
    homePlayer: { name: "Amir Attia", initials: "AA" },
    awayPlayer: { name: "Hany Saad", initials: "HS" },
    scoreLine: "-",
    canSubmitResult: true,
  },
  {
    id: "match-2",
    tournamentName: "League Cup Spring",
    venue: "Alexandria Sports Club",
    stage: "Quarterfinal",
    dateTime: "2026-03-24T18:30:00.000Z",
    status: "Completed",
    homePlayer: { name: "Amir Attia", initials: "AA" },
    awayPlayer: { name: "Youssef Ali", initials: "YA" },
    scoreLine: "4 - 1",
    canSubmitResult: false,
  },
  {
    id: "match-3",
    tournamentName: "Cairo Premier League",
    venue: "NSL Arena - TV Table",
    stage: "Round 6",
    dateTime: "2026-03-21T21:15:00.000Z",
    status: "In Progress",
    homePlayer: { name: "Amir Attia", initials: "AA" },
    awayPlayer: { name: "Omar Lotfy", initials: "OL" },
    scoreLine: "2 - 2",
    canSubmitResult: true,
  },
];

export const scoringSessions: ScoringSession[] = [
  {
    id: "session-1",
    opponent: "Hany Saad",
    venue: "NSL Arena",
    startedAt: "Mar 21, 9:14 PM",
    tableLabel: "Table 3",
    status: "Paused after frame 4",
  },
  {
    id: "session-2",
    opponent: "Youssef Ali",
    venue: "Alexandria Sports Club",
    startedAt: "Mar 18, 6:02 PM",
    tableLabel: "TV Table",
    status: "Completed and synced",
  },
];

export const leagueResults: LeagueResultCard[] = [
  {
    id: "result-1",
    title: "Cairo Premier League - Round 6",
    meta: "NSL Arena",
    status: "Updated 32 min ago",
    summary: "Amir Attia 4-2 Hany Saad, Karim Farid 4-0 Bassem Adel.",
  },
  {
    id: "result-2",
    title: "League Cup Spring - Quarterfinals",
    meta: "Alexandria Sports Club",
    status: "Locked",
    summary: "Top seed advanced in three of four matches with one deciding frame finish.",
  },
];

export const leagueRankings: LeagueRankingCard[] = [
  { id: "lr-1", position: 1, player: "Karim Farid", points: 36, movement: "+2" },
  { id: "lr-2", position: 2, player: "Amir Attia", points: 34, movement: "+1" },
  { id: "lr-3", position: 3, player: "Hany Saad", points: 31, movement: "-1" },
  { id: "lr-4", position: 4, player: "Youssef Ali", points: 28, movement: "0" },
];

export const leagueGroups: DivisionGroupCard[] = [
  { id: "group-1", title: "Division A - Group North", leader: "Amir Attia", venue: "NSL Arena", update: "4 fixtures remaining" },
  { id: "group-2", title: "Division A - Group South", leader: "Karim Farid", venue: "Heliopolis Snooker Lounge", update: "Tight top-three race" },
  { id: "group-3", title: "Division B - Group East", leader: "Samir Kamel", venue: "Mansoura Cue House", update: "Promotion battle live" },
];

export const roleOverviewMetrics: Record<UserRole, RoleOverviewMetric[]> = {
  player: [
    { id: "ov-player-1", label: "Live Entries", value: "2", helper: "Registered competitions this month" },
    { id: "ov-player-2", label: "Upcoming Matches", value: "3", helper: "Next 10 days" },
    { id: "ov-player-3", label: "Profile Status", value: "92%", helper: "Documents and contact info complete" },
  ],
  tournament_manager: [
    { id: "ov-manager-1", label: "Open Draws", value: "5", helper: "Awaiting final seeding lock" },
    { id: "ov-manager-2", label: "Result Submissions", value: "8", helper: "Pending review tonight" },
    { id: "ov-manager-3", label: "Venue Alerts", value: "2", helper: "Table assignments need attention" },
  ],
  league_admin: [
    { id: "ov-admin-1", label: "League Requests", value: "11", helper: "Access and approval queue" },
    { id: "ov-admin-2", label: "Policy Windows", value: "3", helper: "Deadlines expiring this week" },
    { id: "ov-admin-3", label: "Division Health", value: "98%", helper: "Schedules and results synced" },
  ],
};