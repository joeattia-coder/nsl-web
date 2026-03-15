CREATE TYPE "VideoSourceType" AS ENUM ('YOUTUBE', 'UPLOAD');

CREATE TABLE "VideoHighlight" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" "VideoSourceType" NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "showInCarousel" BOOLEAN NOT NULL DEFAULT false,
    "carouselSortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoHighlight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VideoHighlight_showInCarousel_carouselSortOrder_updatedAt_idx"
ON "VideoHighlight"("showInCarousel", "carouselSortOrder", "updatedAt");