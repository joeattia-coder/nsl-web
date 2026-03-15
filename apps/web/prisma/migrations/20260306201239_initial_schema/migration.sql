-- CreateTable
CREATE TABLE "roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_name" VARCHAR(100) NOT NULL,
    "role_description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" BIGSERIAL NOT NULL,
    "role_id" BIGINT,
    "player_id" BIGINT,
    "email" VARCHAR(255),
    "password_hash" TEXT,
    "display_name" VARCHAR(255),
    "is_login_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "seasonID" BIGINT NOT NULL,
    "currentSeason" BOOLEAN,
    "seasonEndDate" TEXT,
    "seasonEndDateInMilliseconds" BIGINT,
    "seasonName" VARCHAR(255) NOT NULL,
    "seasonStartDate" TEXT,
    "seasonStartDateInMilliseconds" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("seasonID")
);

-- CreateTable
CREATE TABLE "fixture_groups" (
    "fixtureGroupIdentifier" BIGINT NOT NULL,
    "seasonID" BIGINT NOT NULL,
    "fixtureGroupDesc" VARCHAR(255),
    "fixtureTypeDesc" VARCHAR(255),
    "fixtureTypeID" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "fixture_groups_pkey" PRIMARY KEY ("fixtureGroupIdentifier")
);

-- CreateTable
CREATE TABLE "teams" (
    "teamID" BIGINT NOT NULL,
    "fixtureGroupIdentifier" BIGINT,
    "teamName" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("teamID")
);

-- CreateTable
CREATE TABLE "fixtures" (
    "fixtureID" BIGINT NOT NULL,
    "seasonID" BIGINT,
    "fixtureGroupIdentifier" BIGINT,
    "homeTeamID" BIGINT,
    "roadTeamID" BIGINT,
    "additionalScore" TEXT,
    "fixtureDate" TEXT,
    "fixtureDateInMilliseconds" BIGINT,
    "fixtureDateStatusDesc" VARCHAR(255),
    "fixtureDateStatusID" BIGINT,
    "fixtureGroupDesc" VARCHAR(255),
    "fixtureNote" TEXT,
    "fixtureStatus" VARCHAR(100),
    "fixtureStatusDesc" VARCHAR(255),
    "fixtureTypeID" BIGINT,
    "homeScore" VARCHAR(100),
    "homeScoreNote" TEXT,
    "homeTeamName" VARCHAR(255),
    "noResultOutcome" VARCHAR(255),
    "result" VARCHAR(255),
    "roadScore" VARCHAR(100),
    "roadScoreNote" TEXT,
    "roadTeamName" VARCHAR(255),
    "roundDesc" VARCHAR(255),
    "shortCode" VARCHAR(100),
    "venueAndSubVenueDesc" VARCHAR(255),
    "officialAssignments" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("fixtureID")
);

-- CreateTable
CREATE TABLE "standings" (
    "standing_id" BIGSERIAL NOT NULL,
    "fixtureGroupIdentifier" BIGINT,
    "standingsDesc" VARCHAR(255),
    "adjustmentMade" DECIMAL(10,2),
    "bonusPoints" DECIMAL(10,2),
    "homeLoss" INTEGER,
    "homePlayed" INTEGER,
    "homeRecentForm" VARCHAR(100),
    "homeScoreAgainst" DECIMAL(10,2),
    "homeScoreAgainstLevel2" DECIMAL(10,2),
    "homeScoreAgainstLevel3" DECIMAL(10,2),
    "homeScoreFor" DECIMAL(10,2),
    "homeTied" INTEGER,
    "homeWon" INTEGER,
    "overallLoss" INTEGER,
    "overallPlayed" INTEGER,
    "overallScoreAgainst" DECIMAL(10,2),
    "overallScoreAgainstLevel2" DECIMAL(10,2),
    "overallScoreAgainstLevel3" DECIMAL(10,2),
    "overallScoreFor" DECIMAL(10,2),
    "overallScoreForLevel2" DECIMAL(10,2),
    "overallScoreForLevel3" DECIMAL(10,2),
    "overallTied" INTEGER,
    "overallWinPercentage" DECIMAL(10,2),
    "overallWon" INTEGER,
    "points" DECIMAL(10,2),
    "position" INTEGER,
    "recentForm" VARCHAR(100),
    "roadLoss" INTEGER,
    "roadPlayed" INTEGER,
    "roadRecentForm" VARCHAR(100),
    "roadScoreAgainst" DECIMAL(10,2),
    "roadScoreAgainstLevel2" DECIMAL(10,2),
    "roadScoreAgainstLevel3" DECIMAL(10,2),
    "roadTied" INTEGER,
    "roadWon" INTEGER,
    "scoreDifference" DECIMAL(10,2),
    "teamID" BIGINT,
    "teamName" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("standing_id")
);

-- CreateTable
CREATE TABLE "players" (
    "personID" BIGINT NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "email" VARCHAR(255),
    "photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("personID")
);

-- CreateTable
CREATE TABLE "team_statistic_summaries" (
    "team_statistic_summary_id" BIGSERIAL NOT NULL,
    "teamID" BIGINT,
    "firstName" VARCHAR(100),
    "handicapValue" DECIMAL(10,2),
    "lastName" VARCHAR(100),
    "leagueStatTypeID" BIGINT,
    "leagueStatTypeName" VARCHAR(255),
    "numberEntered" DECIMAL(10,2),
    "personID" BIGINT,
    "statTypeValue" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "team_statistic_summaries_pkey" PRIMARY KEY ("team_statistic_summary_id")
);

-- CreateTable
CREATE TABLE "venues" (
    "venue_id" BIGSERIAL NOT NULL,
    "contactPhoneNumber" VARCHAR(100),
    "venueAddr1" VARCHAR(255),
    "venueAddr2" VARCHAR(255),
    "venueAddr3" VARCHAR(255),
    "venueCity" VARCHAR(100),
    "venueCounty" VARCHAR(100),
    "venueDir" TEXT,
    "venueName" VARCHAR(255),
    "venueState" VARCHAR(100),
    "venueZipOrPostCode" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("venue_id")
);

-- CreateTable
CREATE TABLE "full_fixture_details" (
    "fixtureID" BIGINT NOT NULL,
    "venue_id" BIGINT,
    "availableHomePlayers" JSONB,
    "availableRoadPlayers" JSONB,
    "gameFormat" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "full_fixture_details_pkey" PRIMARY KEY ("fixtureID")
);

-- CreateTable
CREATE TABLE "full_fixture_available_home_players" (
    "full_fixture_available_home_player_id" BIGSERIAL NOT NULL,
    "fixtureID" BIGINT NOT NULL,
    "personID" BIGINT NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "full_fixture_available_home_players_pkey" PRIMARY KEY ("full_fixture_available_home_player_id")
);

-- CreateTable
CREATE TABLE "full_fixture_available_road_players" (
    "full_fixture_available_road_player_id" BIGSERIAL NOT NULL,
    "fixtureID" BIGINT NOT NULL,
    "personID" BIGINT NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "full_fixture_available_road_players_pkey" PRIMARY KEY ("full_fixture_available_road_player_id")
);

-- CreateTable
CREATE TABLE "full_fixture_game_groups" (
    "full_fixture_game_group_id" BIGSERIAL NOT NULL,
    "fixtureID" BIGINT NOT NULL,
    "gameGroupDesc" VARCHAR(255),
    "sort_order" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "full_fixture_game_groups_pkey" PRIMARY KEY ("full_fixture_game_group_id")
);

-- CreateTable
CREATE TABLE "full_fixture_games" (
    "full_fixture_game_id" BIGSERIAL NOT NULL,
    "full_fixture_game_group_id" BIGINT NOT NULL,
    "homeScoreLevel1" DECIMAL(10,2),
    "roadScoreLevel1" DECIMAL(10,2),
    "raw_game_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "full_fixture_games_pkey" PRIMARY KEY ("full_fixture_game_id")
);

-- CreateTable
CREATE TABLE "full_fixture_game_home_players" (
    "full_fixture_game_home_player_id" BIGSERIAL NOT NULL,
    "full_fixture_game_id" BIGINT NOT NULL,
    "personID" BIGINT NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "full_fixture_game_home_players_pkey" PRIMARY KEY ("full_fixture_game_home_player_id")
);

-- CreateTable
CREATE TABLE "full_fixture_game_road_players" (
    "full_fixture_game_road_player_id" BIGSERIAL NOT NULL,
    "full_fixture_game_id" BIGINT NOT NULL,
    "personID" BIGINT NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "full_fixture_game_road_players_pkey" PRIMARY KEY ("full_fixture_game_road_player_id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "tournament_id" BIGSERIAL NOT NULL,
    "seasonID" BIGINT,
    "venue_id" BIGINT,
    "tournament_name" VARCHAR(255) NOT NULL,
    "tournament_type" VARCHAR(50),
    "has_group_stage" BOOLEAN NOT NULL DEFAULT false,
    "has_knockout_stage" BOOLEAN NOT NULL DEFAULT false,
    "group_count" INTEGER NOT NULL DEFAULT 0,
    "players_per_group" INTEGER NOT NULL DEFAULT 0,
    "players_advancing_per_group" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("tournament_id")
);

-- CreateTable
CREATE TABLE "tournament_groups" (
    "group_id" BIGSERIAL NOT NULL,
    "tournament_id" BIGINT NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "group_order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "tournament_group_players" (
    "tournament_group_player_id" BIGSERIAL NOT NULL,
    "tournament_id" BIGINT NOT NULL,
    "group_id" BIGINT NOT NULL,
    "personID" BIGINT NOT NULL,
    "seed_no" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_group_players_pkey" PRIMARY KEY ("tournament_group_player_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "match_id" BIGSERIAL NOT NULL,
    "tournament_id" BIGINT,
    "group_id" BIGINT,
    "venue_id" BIGINT,
    "round_name" VARCHAR(100),
    "stage_name" VARCHAR(100),
    "match_date" DATE,
    "match_time" VARCHAR(20),
    "home_player_id" BIGINT,
    "away_player_id" BIGINT,
    "home_score" DECIMAL(10,2),
    "away_score" DECIMAL(10,2),
    "winner_player_id" BIGINT,
    "is_knockout" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50),
    "created_by_user_id" BIGINT,
    "updated_by_user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("match_id")
);

-- CreateTable
CREATE TABLE "news_articles" (
    "news_article_id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "embedded_video_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(6),
    "created_by_user_id" BIGINT,
    "updated_by_user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("news_article_id")
);

-- CreateTable
CREATE TABLE "youtube_videos" (
    "youtube_video_id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "youtube_url" TEXT NOT NULL,
    "youtube_embed_url" TEXT,
    "thumbnail_url" TEXT,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ(6),
    "created_by_user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "youtube_videos_pkey" PRIMARY KEY ("youtube_video_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "standings_fixtureGroupIdentifier_teamID_standingsDesc_key" ON "standings"("fixtureGroupIdentifier", "teamID", "standingsDesc");

-- CreateIndex
CREATE UNIQUE INDEX "full_fixture_available_home_players_fixtureID_personID_key" ON "full_fixture_available_home_players"("fixtureID", "personID");

-- CreateIndex
CREATE UNIQUE INDEX "full_fixture_available_road_players_fixtureID_personID_key" ON "full_fixture_available_road_players"("fixtureID", "personID");

-- CreateIndex
CREATE UNIQUE INDEX "full_fixture_game_home_players_full_fixture_game_id_personI_key" ON "full_fixture_game_home_players"("full_fixture_game_id", "personID");

-- CreateIndex
CREATE UNIQUE INDEX "full_fixture_game_road_players_full_fixture_game_id_personI_key" ON "full_fixture_game_road_players"("full_fixture_game_id", "personID");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_groups_tournament_id_group_name_key" ON "tournament_groups"("tournament_id", "group_name");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_group_players_group_id_personID_key" ON "tournament_group_players"("group_id", "personID");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_slug_key" ON "news_articles"("slug");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("personID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture_groups" ADD CONSTRAINT "fixture_groups_seasonID_fkey" FOREIGN KEY ("seasonID") REFERENCES "seasons"("seasonID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_fixtureGroupIdentifier_fkey" FOREIGN KEY ("fixtureGroupIdentifier") REFERENCES "fixture_groups"("fixtureGroupIdentifier") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_seasonID_fkey" FOREIGN KEY ("seasonID") REFERENCES "seasons"("seasonID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_fixtureGroupIdentifier_fkey" FOREIGN KEY ("fixtureGroupIdentifier") REFERENCES "fixture_groups"("fixtureGroupIdentifier") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_homeTeamID_fkey" FOREIGN KEY ("homeTeamID") REFERENCES "teams"("teamID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_roadTeamID_fkey" FOREIGN KEY ("roadTeamID") REFERENCES "teams"("teamID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_fixtureGroupIdentifier_fkey" FOREIGN KEY ("fixtureGroupIdentifier") REFERENCES "fixture_groups"("fixtureGroupIdentifier") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_teamID_fkey" FOREIGN KEY ("teamID") REFERENCES "teams"("teamID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_statistic_summaries" ADD CONSTRAINT "team_statistic_summaries_teamID_fkey" FOREIGN KEY ("teamID") REFERENCES "teams"("teamID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_statistic_summaries" ADD CONSTRAINT "team_statistic_summaries_personID_fkey" FOREIGN KEY ("personID") REFERENCES "players"("personID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_details" ADD CONSTRAINT "full_fixture_details_fixtureID_fkey" FOREIGN KEY ("fixtureID") REFERENCES "fixtures"("fixtureID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_details" ADD CONSTRAINT "full_fixture_details_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_available_home_players" ADD CONSTRAINT "full_fixture_available_home_players_fixtureID_fkey" FOREIGN KEY ("fixtureID") REFERENCES "full_fixture_details"("fixtureID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_available_home_players" ADD CONSTRAINT "full_fixture_available_home_players_personID_fkey" FOREIGN KEY ("personID") REFERENCES "players"("personID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_available_road_players" ADD CONSTRAINT "full_fixture_available_road_players_fixtureID_fkey" FOREIGN KEY ("fixtureID") REFERENCES "full_fixture_details"("fixtureID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_available_road_players" ADD CONSTRAINT "full_fixture_available_road_players_personID_fkey" FOREIGN KEY ("personID") REFERENCES "players"("personID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_game_groups" ADD CONSTRAINT "full_fixture_game_groups_fixtureID_fkey" FOREIGN KEY ("fixtureID") REFERENCES "full_fixture_details"("fixtureID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_games" ADD CONSTRAINT "full_fixture_games_full_fixture_game_group_id_fkey" FOREIGN KEY ("full_fixture_game_group_id") REFERENCES "full_fixture_game_groups"("full_fixture_game_group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_game_home_players" ADD CONSTRAINT "full_fixture_game_home_players_full_fixture_game_id_fkey" FOREIGN KEY ("full_fixture_game_id") REFERENCES "full_fixture_games"("full_fixture_game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_game_home_players" ADD CONSTRAINT "full_fixture_game_home_players_personID_fkey" FOREIGN KEY ("personID") REFERENCES "players"("personID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_game_road_players" ADD CONSTRAINT "full_fixture_game_road_players_full_fixture_game_id_fkey" FOREIGN KEY ("full_fixture_game_id") REFERENCES "full_fixture_games"("full_fixture_game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_game_road_players" ADD CONSTRAINT "full_fixture_game_road_players_personID_fkey" FOREIGN KEY ("personID") REFERENCES "players"("personID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_seasonID_fkey" FOREIGN KEY ("seasonID") REFERENCES "seasons"("seasonID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_groups" ADD CONSTRAINT "tournament_groups_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_group_players" ADD CONSTRAINT "tournament_group_players_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_group_players" ADD CONSTRAINT "tournament_group_players_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_group_players" ADD CONSTRAINT "tournament_group_players_personID_fkey" FOREIGN KEY ("personID") REFERENCES "players"("personID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_player_id_fkey" FOREIGN KEY ("home_player_id") REFERENCES "players"("personID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_player_id_fkey" FOREIGN KEY ("away_player_id") REFERENCES "players"("personID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_player_id_fkey" FOREIGN KEY ("winner_player_id") REFERENCES "players"("personID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "youtube_videos" ADD CONSTRAINT "youtube_videos_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
