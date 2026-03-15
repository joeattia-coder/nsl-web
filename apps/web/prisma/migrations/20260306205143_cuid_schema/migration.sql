/*
  Warnings:

  - The primary key for the `fixture_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `full_fixture_available_home_players` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `full_fixture_available_road_players` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `venue_id` on the `full_fixture_details` table. All the data in the column will be lost.
  - The primary key for the `full_fixture_game_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `full_fixture_game_home_players` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `full_fixture_game_road_players` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `full_fixture_games` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `matches` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `news_articles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `standings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `team_statistic_summaries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tournament_group_players` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tournament_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tournaments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `venues` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `youtube_videos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[lr_fixtureGroupIdentifier]` on the table `fixture_groups` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "fixtures" DROP CONSTRAINT "fixtures_fixtureGroupIdentifier_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_details" DROP CONSTRAINT "full_fixture_details_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_game_home_players" DROP CONSTRAINT "full_fixture_game_home_players_full_fixture_game_id_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_game_road_players" DROP CONSTRAINT "full_fixture_game_road_players_full_fixture_game_id_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_games" DROP CONSTRAINT "full_fixture_games_full_fixture_game_group_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_group_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_tournament_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "news_articles" DROP CONSTRAINT "news_articles_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "news_articles" DROP CONSTRAINT "news_articles_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "standings" DROP CONSTRAINT "standings_fixtureGroupIdentifier_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_fixtureGroupIdentifier_fkey";

-- DropForeignKey
ALTER TABLE "tournament_group_players" DROP CONSTRAINT "tournament_group_players_group_id_fkey";

-- DropForeignKey
ALTER TABLE "tournament_group_players" DROP CONSTRAINT "tournament_group_players_tournament_id_fkey";

-- DropForeignKey
ALTER TABLE "tournament_groups" DROP CONSTRAINT "tournament_groups_tournament_id_fkey";

-- DropForeignKey
ALTER TABLE "tournaments" DROP CONSTRAINT "tournaments_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";

-- DropForeignKey
ALTER TABLE "youtube_videos" DROP CONSTRAINT "youtube_videos_created_by_user_id_fkey";

-- AlterTable
ALTER TABLE "fixture_groups" DROP CONSTRAINT "fixture_groups_pkey",
ADD COLUMN     "lr_fixtureGroupIdentifier" BIGINT,
ALTER COLUMN "fixtureGroupIdentifier" SET DATA TYPE TEXT,
ADD CONSTRAINT "fixture_groups_pkey" PRIMARY KEY ("fixtureGroupIdentifier");

-- AlterTable
ALTER TABLE "fixtures" ADD COLUMN     "venue_id" TEXT,
ALTER COLUMN "fixtureGroupIdentifier" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "full_fixture_available_home_players" DROP CONSTRAINT "full_fixture_available_home_players_pkey",
ALTER COLUMN "full_fixture_available_home_player_id" DROP DEFAULT,
ALTER COLUMN "full_fixture_available_home_player_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "full_fixture_available_home_players_pkey" PRIMARY KEY ("full_fixture_available_home_player_id");
DROP SEQUENCE "full_fixture_available_home_p_full_fixture_available_home_p_seq";

-- AlterTable
ALTER TABLE "full_fixture_available_road_players" DROP CONSTRAINT "full_fixture_available_road_players_pkey",
ALTER COLUMN "full_fixture_available_road_player_id" DROP DEFAULT,
ALTER COLUMN "full_fixture_available_road_player_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "full_fixture_available_road_players_pkey" PRIMARY KEY ("full_fixture_available_road_player_id");
DROP SEQUENCE "full_fixture_available_road_p_full_fixture_available_road_p_seq";

-- AlterTable
ALTER TABLE "full_fixture_details" DROP COLUMN "venue_id";

-- AlterTable
ALTER TABLE "full_fixture_game_groups" DROP CONSTRAINT "full_fixture_game_groups_pkey",
ALTER COLUMN "full_fixture_game_group_id" DROP DEFAULT,
ALTER COLUMN "full_fixture_game_group_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "full_fixture_game_groups_pkey" PRIMARY KEY ("full_fixture_game_group_id");
DROP SEQUENCE "full_fixture_game_groups_full_fixture_game_group_id_seq";

-- AlterTable
ALTER TABLE "full_fixture_game_home_players" DROP CONSTRAINT "full_fixture_game_home_players_pkey",
ALTER COLUMN "full_fixture_game_home_player_id" DROP DEFAULT,
ALTER COLUMN "full_fixture_game_home_player_id" SET DATA TYPE TEXT,
ALTER COLUMN "full_fixture_game_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "full_fixture_game_home_players_pkey" PRIMARY KEY ("full_fixture_game_home_player_id");
DROP SEQUENCE "full_fixture_game_home_player_full_fixture_game_home_player_seq";

-- AlterTable
ALTER TABLE "full_fixture_game_road_players" DROP CONSTRAINT "full_fixture_game_road_players_pkey",
ALTER COLUMN "full_fixture_game_road_player_id" DROP DEFAULT,
ALTER COLUMN "full_fixture_game_road_player_id" SET DATA TYPE TEXT,
ALTER COLUMN "full_fixture_game_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "full_fixture_game_road_players_pkey" PRIMARY KEY ("full_fixture_game_road_player_id");
DROP SEQUENCE "full_fixture_game_road_player_full_fixture_game_road_player_seq";

-- AlterTable
ALTER TABLE "full_fixture_games" DROP CONSTRAINT "full_fixture_games_pkey",
ALTER COLUMN "full_fixture_game_id" DROP DEFAULT,
ALTER COLUMN "full_fixture_game_id" SET DATA TYPE TEXT,
ALTER COLUMN "full_fixture_game_group_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "full_fixture_games_pkey" PRIMARY KEY ("full_fixture_game_id");
DROP SEQUENCE "full_fixture_games_full_fixture_game_id_seq";

-- AlterTable
ALTER TABLE "matches" DROP CONSTRAINT "matches_pkey",
ALTER COLUMN "match_id" DROP DEFAULT,
ALTER COLUMN "match_id" SET DATA TYPE TEXT,
ALTER COLUMN "tournament_id" SET DATA TYPE TEXT,
ALTER COLUMN "group_id" SET DATA TYPE TEXT,
ALTER COLUMN "venue_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by_user_id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by_user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("match_id");
DROP SEQUENCE "matches_match_id_seq";

-- AlterTable
ALTER TABLE "news_articles" DROP CONSTRAINT "news_articles_pkey",
ALTER COLUMN "news_article_id" DROP DEFAULT,
ALTER COLUMN "news_article_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by_user_id" SET DATA TYPE TEXT,
ALTER COLUMN "updated_by_user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "news_articles_pkey" PRIMARY KEY ("news_article_id");
DROP SEQUENCE "news_articles_news_article_id_seq";

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
ALTER COLUMN "role_id" DROP DEFAULT,
ALTER COLUMN "role_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id");
DROP SEQUENCE "roles_role_id_seq";

-- AlterTable
ALTER TABLE "standings" DROP CONSTRAINT "standings_pkey",
ALTER COLUMN "standing_id" DROP DEFAULT,
ALTER COLUMN "standing_id" SET DATA TYPE TEXT,
ALTER COLUMN "fixtureGroupIdentifier" SET DATA TYPE TEXT,
ADD CONSTRAINT "standings_pkey" PRIMARY KEY ("standing_id");
DROP SEQUENCE "standings_standing_id_seq";

-- AlterTable
ALTER TABLE "team_statistic_summaries" DROP CONSTRAINT "team_statistic_summaries_pkey",
ALTER COLUMN "team_statistic_summary_id" DROP DEFAULT,
ALTER COLUMN "team_statistic_summary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "team_statistic_summaries_pkey" PRIMARY KEY ("team_statistic_summary_id");
DROP SEQUENCE "team_statistic_summaries_team_statistic_summary_id_seq";

-- AlterTable
ALTER TABLE "teams" ALTER COLUMN "fixtureGroupIdentifier" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tournament_group_players" DROP CONSTRAINT "tournament_group_players_pkey",
ALTER COLUMN "tournament_group_player_id" DROP DEFAULT,
ALTER COLUMN "tournament_group_player_id" SET DATA TYPE TEXT,
ALTER COLUMN "tournament_id" SET DATA TYPE TEXT,
ALTER COLUMN "group_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tournament_group_players_pkey" PRIMARY KEY ("tournament_group_player_id");
DROP SEQUENCE "tournament_group_players_tournament_group_player_id_seq";

-- AlterTable
ALTER TABLE "tournament_groups" DROP CONSTRAINT "tournament_groups_pkey",
ALTER COLUMN "group_id" DROP DEFAULT,
ALTER COLUMN "group_id" SET DATA TYPE TEXT,
ALTER COLUMN "tournament_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tournament_groups_pkey" PRIMARY KEY ("group_id");
DROP SEQUENCE "tournament_groups_group_id_seq";

-- AlterTable
ALTER TABLE "tournaments" DROP CONSTRAINT "tournaments_pkey",
ALTER COLUMN "tournament_id" DROP DEFAULT,
ALTER COLUMN "tournament_id" SET DATA TYPE TEXT,
ALTER COLUMN "venue_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tournaments_pkey" PRIMARY KEY ("tournament_id");
DROP SEQUENCE "tournaments_tournament_id_seq";

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "user_id" DROP DEFAULT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "role_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");
DROP SEQUENCE "users_user_id_seq";

-- AlterTable
ALTER TABLE "venues" DROP CONSTRAINT "venues_pkey",
ALTER COLUMN "venue_id" DROP DEFAULT,
ALTER COLUMN "venue_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("venue_id");
DROP SEQUENCE "venues_venue_id_seq";

-- AlterTable
ALTER TABLE "youtube_videos" DROP CONSTRAINT "youtube_videos_pkey",
ALTER COLUMN "youtube_video_id" DROP DEFAULT,
ALTER COLUMN "youtube_video_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by_user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "youtube_videos_pkey" PRIMARY KEY ("youtube_video_id");
DROP SEQUENCE "youtube_videos_youtube_video_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "fixture_groups_lr_fixtureGroupIdentifier_key" ON "fixture_groups"("lr_fixtureGroupIdentifier");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_fixtureGroupIdentifier_fkey" FOREIGN KEY ("fixtureGroupIdentifier") REFERENCES "fixture_groups"("fixtureGroupIdentifier") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_fixtureGroupIdentifier_fkey" FOREIGN KEY ("fixtureGroupIdentifier") REFERENCES "fixture_groups"("fixtureGroupIdentifier") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_fixtureGroupIdentifier_fkey" FOREIGN KEY ("fixtureGroupIdentifier") REFERENCES "fixture_groups"("fixtureGroupIdentifier") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_games" ADD CONSTRAINT "full_fixture_games_full_fixture_game_group_id_fkey" FOREIGN KEY ("full_fixture_game_group_id") REFERENCES "full_fixture_game_groups"("full_fixture_game_group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_game_home_players" ADD CONSTRAINT "full_fixture_game_home_players_full_fixture_game_id_fkey" FOREIGN KEY ("full_fixture_game_id") REFERENCES "full_fixture_games"("full_fixture_game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "full_fixture_game_road_players" ADD CONSTRAINT "full_fixture_game_road_players_full_fixture_game_id_fkey" FOREIGN KEY ("full_fixture_game_id") REFERENCES "full_fixture_games"("full_fixture_game_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_groups" ADD CONSTRAINT "tournament_groups_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_group_players" ADD CONSTRAINT "tournament_group_players_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_group_players" ADD CONSTRAINT "tournament_group_players_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

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
