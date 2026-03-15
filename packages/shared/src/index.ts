export type MatchStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "POSTPONED"
  | "CANCELLED"
  | "FORFEIT"
  | "ABANDONED";

export type ScheduleStatus = "TBC" | "CONFIRMED";

export type HomeNewsPlacement = "SCROLLING_BANNER" | "NEWS_SECTION";

export type HomeNewsDisplayMode = "THUMBNAIL" | "TITLE" | "THUMBNAIL_TITLE";

export type PublicNewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  homePlacement: HomeNewsPlacement | null;
  homeDisplayMode: HomeNewsDisplayMode | null;
  homeSortOrder: number;
  publishedAt: string | null;
};

export type PublicNewsArticleDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type PublicNewsResponse = {
  articles: PublicNewsArticle[];
};

export type PublicNewsDetailResponse = {
  article: PublicNewsArticleDetail;
};

export type PublicFixture = {
  id: string;
  fixtureId: string;
  fixtureDate: string;
  fixtureDateTime: string;
  fixtureTime: string;
  homeTeamName: string;
  roadTeamName: string;
  homeCountryCode: string;
  roadCountryCode: string;
  homePlayerPhotoUrl: string | null;
  roadPlayerPhotoUrl: string | null;
  homeScore: number | null;
  roadScore: number | null;
  fixtureGroupIdentifier: string;
  fixtureGroupDesc: string;
  roundDesc: string;
  roundType: string;
  seasonId: string;
  seasonDesc: string;
  matchStatus: MatchStatus;
  scheduleStatus: ScheduleStatus;
};

export type PublicFixtureDetail = PublicFixture & {
  publicNote: string | null;
  venue: {
    name: string;
    summary: string;
  } | null;
};

export type PublicFixturesResponse = {
  count: number;
  fixtures: PublicFixture[];
};

export type PublicFixtureDetailResponse = {
  fixture: PublicFixtureDetail;
};

export type PublicSeason = {
  id: string;
  seasonName: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leagueId: string | null;
};

export type PublicSeasonsResponse = {
  count: number;
  seasons: PublicSeason[];
};