/*
  Warnings:

  - You are about to drop the `fixture_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fixtures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `full_fixture_available_home_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `full_fixture_available_road_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `full_fixture_details` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `full_fixture_game_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `full_fixture_game_home_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `full_fixture_game_road_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `full_fixture_games` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `matches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `news_articles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seasons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `standings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_statistic_summaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournament_group_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournament_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournaments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `venues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `youtube_videos` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('SINGLES', 'DOUBLES', 'TRIPLES', 'TEAM');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TournamentStageType" AS ENUM ('GROUP', 'KNOCKOUT');

-- CreateEnum
CREATE TYPE "StageRoundType" AS ENUM ('GROUP', 'KNOCKOUT');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED', 'FORFEIT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('TBC', 'CONFIRMED');

-- DropForeignKey
ALTER TABLE "fixture_groups" DROP CONSTRAINT "fixture_groups_seasonID_fkey";

-- DropForeignKey
ALTER TABLE "fixtures" DROP CONSTRAINT "fixtures_fixtureGroupIdentifier_fkey";

-- DropForeignKey
ALTER TABLE "fixtures" DROP CONSTRAINT "fixtures_homeTeamID_fkey";

-- DropForeignKey
ALTER TABLE "fixtures" DROP CONSTRAINT "fixtures_roadTeamID_fkey";

-- DropForeignKey
ALTER TABLE "fixtures" DROP CONSTRAINT "fixtures_seasonID_fkey";

-- DropForeignKey
ALTER TABLE "fixtures" DROP CONSTRAINT "fixtures_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_available_home_players" DROP CONSTRAINT "full_fixture_available_home_players_fixtureID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_available_home_players" DROP CONSTRAINT "full_fixture_available_home_players_personID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_available_road_players" DROP CONSTRAINT "full_fixture_available_road_players_fixtureID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_available_road_players" DROP CONSTRAINT "full_fixture_available_road_players_personID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_details" DROP CONSTRAINT "full_fixture_details_fixtureID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_game_groups" DROP CONSTRAINT "full_fixture_game_groups_fixtureID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_game_home_players" DROP CONSTRAINT "full_fixture_game_home_players_full_fixture_game_id_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_game_home_players" DROP CONSTRAINT "full_fixture_game_home_players_personID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_game_road_players" DROP CONSTRAINT "full_fixture_game_road_players_full_fixture_game_id_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_game_road_players" DROP CONSTRAINT "full_fixture_game_road_players_personID_fkey";

-- DropForeignKey
ALTER TABLE "full_fixture_games" DROP CONSTRAINT "full_fixture_games_full_fixture_game_group_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_away_player_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_group_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_home_player_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_tournament_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_winner_player_id_fkey";

-- DropForeignKey
ALTER TABLE "news_articles" DROP CONSTRAINT "news_articles_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "news_articles" DROP CONSTRAINT "news_articles_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "standings" DROP CONSTRAINT "standings_fixtureGroupIdentifier_fkey";

-- DropForeignKey
ALTER TABLE "standings" DROP CONSTRAINT "standings_teamID_fkey";

-- DropForeignKey
ALTER TABLE "team_statistic_summaries" DROP CONSTRAINT "team_statistic_summaries_personID_fkey";

-- DropForeignKey
ALTER TABLE "team_statistic_summaries" DROP CONSTRAINT "team_statistic_summaries_teamID_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_fixtureGroupIdentifier_fkey";

-- DropForeignKey
ALTER TABLE "tournament_group_players" DROP CONSTRAINT "tournament_group_players_group_id_fkey";

-- DropForeignKey
ALTER TABLE "tournament_group_players" DROP CONSTRAINT "tournament_group_players_personID_fkey";

-- DropForeignKey
ALTER TABLE "tournament_group_players" DROP CONSTRAINT "tournament_group_players_tournament_id_fkey";

-- DropForeignKey
ALTER TABLE "tournament_groups" DROP CONSTRAINT "tournament_groups_tournament_id_fkey";

-- DropForeignKey
ALTER TABLE "tournaments" DROP CONSTRAINT "tournaments_seasonID_fkey";

-- DropForeignKey
ALTER TABLE "tournaments" DROP CONSTRAINT "tournaments_venue_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_player_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_role_id_fkey";

-- DropForeignKey
ALTER TABLE "youtube_videos" DROP CONSTRAINT "youtube_videos_created_by_user_id_fkey";

-- DropTable
DROP TABLE "fixture_groups";

-- DropTable
DROP TABLE "fixtures";

-- DropTable
DROP TABLE "full_fixture_available_home_players";

-- DropTable
DROP TABLE "full_fixture_available_road_players";

-- DropTable
DROP TABLE "full_fixture_details";

-- DropTable
DROP TABLE "full_fixture_game_groups";

-- DropTable
DROP TABLE "full_fixture_game_home_players";

-- DropTable
DROP TABLE "full_fixture_game_road_players";

-- DropTable
DROP TABLE "full_fixture_games";

-- DropTable
DROP TABLE "matches";

-- DropTable
DROP TABLE "news_articles";

-- DropTable
DROP TABLE "players";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "seasons";

-- DropTable
DROP TABLE "standings";

-- DropTable
DROP TABLE "team_statistic_summaries";

-- DropTable
DROP TABLE "teams";

-- DropTable
DROP TABLE "tournament_group_players";

-- DropTable
DROP TABLE "tournament_groups";

-- DropTable
DROP TABLE "tournaments";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "venues";

-- DropTable
DROP TABLE "youtube_videos";

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "phoneNumber" TEXT,
    "mapLink" TEXT,
    "showOnVenuesPage" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "seasonName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "venueId" TEXT,
    "tournamentName" TEXT NOT NULL,
    "participantType" "ParticipantType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentStage" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "stageType" "TournamentStageType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageRound" (
    "id" TEXT NOT NULL,
    "tournamentStageId" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "roundType" "StageRoundType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "matchesPerPairing" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentGroup" (
    "id" TEXT NOT NULL,
    "stageRoundId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'INACTIVE',
    "isLoginEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "middleInitial" TEXT,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "emailAddress" TEXT,
    "phoneNumber" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEntry" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "entryName" TEXT,
    "seedNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentEntryMember" (
    "id" TEXT NOT NULL,
    "tournamentEntryId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentEntryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupParticipant" (
    "id" TEXT NOT NULL,
    "tournamentGroupId" TEXT NOT NULL,
    "tournamentEntryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "tournamentStageId" TEXT NOT NULL,
    "stageRoundId" TEXT NOT NULL,
    "tournamentGroupId" TEXT,
    "venueId" TEXT,
    "matchDate" TIMESTAMP(3),
    "matchTime" TEXT,
    "scheduleStatus" "ScheduleStatus" NOT NULL DEFAULT 'TBC',
    "matchStatus" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeEntryId" TEXT NOT NULL,
    "awayEntryId" TEXT NOT NULL,
    "winnerEntryId" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "internalNote" TEXT,
    "publicNote" TEXT,
    "resultSubmittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "enteredByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchFrame" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "frameNumber" INTEGER NOT NULL,
    "winnerEntryId" TEXT,
    "homePoints" INTEGER,
    "awayPoints" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchFrame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerBreak" (
    "id" TEXT NOT NULL,
    "matchFrameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "breakValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Venue_venueName_idx" ON "Venue"("venueName");

-- CreateIndex
CREATE UNIQUE INDEX "Season_seasonName_key" ON "Season"("seasonName");

-- CreateIndex
CREATE INDEX "Tournament_seasonId_idx" ON "Tournament"("seasonId");

-- CreateIndex
CREATE INDEX "Tournament_venueId_idx" ON "Tournament"("venueId");

-- CreateIndex
CREATE INDEX "Tournament_tournamentName_idx" ON "Tournament"("tournamentName");

-- CreateIndex
CREATE INDEX "TournamentStage_tournamentId_idx" ON "TournamentStage"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentStage_tournamentId_sequence_key" ON "TournamentStage"("tournamentId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentStage_tournamentId_stageName_key" ON "TournamentStage"("tournamentId", "stageName");

-- CreateIndex
CREATE INDEX "StageRound_tournamentStageId_idx" ON "StageRound"("tournamentStageId");

-- CreateIndex
CREATE UNIQUE INDEX "StageRound_tournamentStageId_sequence_key" ON "StageRound"("tournamentStageId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "StageRound_tournamentStageId_roundName_key" ON "StageRound"("tournamentStageId", "roundName");

-- CreateIndex
CREATE INDEX "TournamentGroup_stageRoundId_idx" ON "TournamentGroup"("stageRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGroup_stageRoundId_sequence_key" ON "TournamentGroup"("stageRoundId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentGroup_stageRoundId_groupName_key" ON "TournamentGroup"("stageRoundId", "groupName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_registrationStatus_idx" ON "User"("registrationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "Player_lastName_firstName_idx" ON "Player"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Player_emailAddress_idx" ON "Player"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "TournamentEntry_tournamentId_idx" ON "TournamentEntry"("tournamentId");

-- CreateIndex
CREATE INDEX "TournamentEntry_seedNumber_idx" ON "TournamentEntry"("seedNumber");

-- CreateIndex
CREATE INDEX "TournamentEntryMember_tournamentEntryId_idx" ON "TournamentEntryMember"("tournamentEntryId");

-- CreateIndex
CREATE INDEX "TournamentEntryMember_playerId_idx" ON "TournamentEntryMember"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentEntryMember_tournamentEntryId_playerId_key" ON "TournamentEntryMember"("tournamentEntryId", "playerId");

-- CreateIndex
CREATE INDEX "GroupParticipant_tournamentGroupId_idx" ON "GroupParticipant"("tournamentGroupId");

-- CreateIndex
CREATE INDEX "GroupParticipant_tournamentEntryId_idx" ON "GroupParticipant"("tournamentEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupParticipant_tournamentGroupId_tournamentEntryId_key" ON "GroupParticipant"("tournamentGroupId", "tournamentEntryId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE INDEX "Match_tournamentStageId_idx" ON "Match"("tournamentStageId");

-- CreateIndex
CREATE INDEX "Match_stageRoundId_idx" ON "Match"("stageRoundId");

-- CreateIndex
CREATE INDEX "Match_tournamentGroupId_idx" ON "Match"("tournamentGroupId");

-- CreateIndex
CREATE INDEX "Match_venueId_idx" ON "Match"("venueId");

-- CreateIndex
CREATE INDEX "Match_homeEntryId_idx" ON "Match"("homeEntryId");

-- CreateIndex
CREATE INDEX "Match_awayEntryId_idx" ON "Match"("awayEntryId");

-- CreateIndex
CREATE INDEX "Match_winnerEntryId_idx" ON "Match"("winnerEntryId");

-- CreateIndex
CREATE INDEX "Match_approvedByUserId_idx" ON "Match"("approvedByUserId");

-- CreateIndex
CREATE INDEX "Match_enteredByUserId_idx" ON "Match"("enteredByUserId");

-- CreateIndex
CREATE INDEX "Match_updatedByUserId_idx" ON "Match"("updatedByUserId");

-- CreateIndex
CREATE INDEX "MatchFrame_matchId_idx" ON "MatchFrame"("matchId");

-- CreateIndex
CREATE INDEX "MatchFrame_winnerEntryId_idx" ON "MatchFrame"("winnerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchFrame_matchId_frameNumber_key" ON "MatchFrame"("matchId", "frameNumber");

-- CreateIndex
CREATE INDEX "PlayerBreak_matchFrameId_idx" ON "PlayerBreak"("matchFrameId");

-- CreateIndex
CREATE INDEX "PlayerBreak_playerId_idx" ON "PlayerBreak"("playerId");

-- CreateIndex
CREATE INDEX "PlayerBreak_breakValue_idx" ON "PlayerBreak"("breakValue");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentStage" ADD CONSTRAINT "TournamentStage_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageRound" ADD CONSTRAINT "StageRound_tournamentStageId_fkey" FOREIGN KEY ("tournamentStageId") REFERENCES "TournamentStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentGroup" ADD CONSTRAINT "TournamentGroup_stageRoundId_fkey" FOREIGN KEY ("stageRoundId") REFERENCES "StageRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntry" ADD CONSTRAINT "TournamentEntry_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntryMember" ADD CONSTRAINT "TournamentEntryMember_tournamentEntryId_fkey" FOREIGN KEY ("tournamentEntryId") REFERENCES "TournamentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentEntryMember" ADD CONSTRAINT "TournamentEntryMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupParticipant" ADD CONSTRAINT "GroupParticipant_tournamentGroupId_fkey" FOREIGN KEY ("tournamentGroupId") REFERENCES "TournamentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupParticipant" ADD CONSTRAINT "GroupParticipant_tournamentEntryId_fkey" FOREIGN KEY ("tournamentEntryId") REFERENCES "TournamentEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentStageId_fkey" FOREIGN KEY ("tournamentStageId") REFERENCES "TournamentStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_stageRoundId_fkey" FOREIGN KEY ("stageRoundId") REFERENCES "StageRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentGroupId_fkey" FOREIGN KEY ("tournamentGroupId") REFERENCES "TournamentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeEntryId_fkey" FOREIGN KEY ("homeEntryId") REFERENCES "TournamentEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayEntryId_fkey" FOREIGN KEY ("awayEntryId") REFERENCES "TournamentEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "TournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchFrame" ADD CONSTRAINT "MatchFrame_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchFrame" ADD CONSTRAINT "MatchFrame_winnerEntryId_fkey" FOREIGN KEY ("winnerEntryId") REFERENCES "TournamentEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerBreak" ADD CONSTRAINT "PlayerBreak_matchFrameId_fkey" FOREIGN KEY ("matchFrameId") REFERENCES "MatchFrame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerBreak" ADD CONSTRAINT "PlayerBreak_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
