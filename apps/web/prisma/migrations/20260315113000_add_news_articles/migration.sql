-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "HomeNewsPlacement" AS ENUM ('SCROLLING_BANNER', 'NEWS_SECTION');

-- CreateEnum
CREATE TYPE "HomeNewsDisplayMode" AS ENUM ('THUMBNAIL', 'TITLE', 'THUMBNAIL_TITLE');

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "contentHtml" TEXT NOT NULL,
    "contentJson" JSONB,
    "coverImageUrl" TEXT,
    "status" "NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "showOnHomePage" BOOLEAN NOT NULL DEFAULT false,
    "homePlacement" "HomeNewsPlacement",
    "homeDisplayMode" "HomeNewsDisplayMode",
    "homeSortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsArticle_slug_key" ON "NewsArticle"("slug");

-- CreateIndex
CREATE INDEX "NewsArticle_status_idx" ON "NewsArticle"("status");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "NewsArticle_showOnHomePage_homePlacement_homeSortOrder_idx" ON "NewsArticle"("showOnHomePage", "homePlacement", "homeSortOrder");