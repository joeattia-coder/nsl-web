import type {
  EloHistoryEntry,
  MatchItem,
  MockUser,
  PerformanceMetric,
  PlayerStat,
  RoleOverviewMetric,
  ScoringSession,
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